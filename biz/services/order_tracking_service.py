import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from datetime import datetime
from zoneinfo import ZoneInfo

from biz.models.order import Order
from adm.models.order_assignments import OrderAssignments
from adm.models.delivery_boy import DeliveryBoyProfile

logger = logging.getLogger(__name__)

VALID_STATUSES = ["waiting", "confirmed", "dispatched", "out for delivery", "delivered"]


# 1. Helper: தற்போதைய நேரத்தை தெளிவான Dictionary-யாக மாற்றுதல் (time, date, display)
def get_current_stage_timestamp():
    now_ist = datetime.now(ZoneInfo("Asia/Kolkata"))
    return {
        "time": now_ist.strftime("%I:%M %p"),               # "08:35 AM"
        "date": now_ist.strftime("%d %b %Y"),               # "20 Nov 2026"
        "display": now_ist.strftime("%d %b %Y, %I:%M %p")   # "20 Nov 2026, 08:35 AM"
    }


# 2. Order-ன் முழு டிராக்கிங் விபரங்களை எடுக்கும் Helper (Image 1 & Image 2-க்கு ஏற்ப மாறும்)
def get_order_tracking_data(order_id):
    order = Order.objects.filter(id=order_id).first()
    if not order:
        return None

    status_clean = order.status.lower()
    is_pickup = "pickup" in (order.delivery_mode or "").lower()
    timestamps = order.stage_timestamps or {}

    time_ist = order.updated_at.astimezone(ZoneInfo("Asia/Kolkata"))
    updated_at_full = time_ist.strftime("%d %b %Y, %I:%M %p")

    # Helper: JSON-லிருந்து அந்தந்த குறிப்பிட்ட Stage-க்கான நேரத்தை எடுத்தல்
    def get_time_for(stage_key):
        entry = timestamps.get(stage_key)
        if isinstance(entry, dict):
            return entry.get("time")
        elif isinstance(entry, str):
            return entry
        return None

    # 3. Delivery Mode-க்கு ஏற்ப Milestones தயாரித்தல்
    if is_pickup:
        # Store Pickup Lifecycle (Waiting -> Confirm & Packing -> Ready for pick up -> Done)
        milestones_defs = [
            {"step": 1, "title": "Waiting", "stage_key": "waiting"},
            {"step": 2, "title": "Confirm & Packing", "stage_key": "confirmed"},
            {"step": 3, "title": "Ready for pick up", "stage_key": "dispatched"},
            {"step": 4, "title": "Done", "stage_key": "delivered"},
        ]
        status_map = {
            "waiting": (1, "Waiting"),
            "confirmed": (2, "Confirm & Packing"),
            "dispatched": (3, "Ready for pick up"),
            "out for delivery": (3, "Ready for pick up"),
            "delivered": (4, "Done"),
        }
        current_index, current_label = status_map.get(status_clean, (1, order.status))

        milestones = []
        for m in milestones_defs:
            idx = m["step"]
            actual_time = get_time_for(m["stage_key"])
            milestones.append({
                "step": idx,
                "title": m["title"],
                "time": actual_time if actual_time else "Waiting",
                "is_completed": idx < current_index,
                "is_current": idx == current_index,
            })

        delivery_boy_data = None

    else:
        # Image 1 & 3: Instant & Scheduled Delivery (Order Placed -> Farm Fresh Packed -> Out for Delivery -> At Your Door)
        milestones_defs = [
            {"step": 1, "title": "Order Placed", "stage_key": "waiting"},
            {"step": 2, "title": "Farm Fresh Packed", "stage_key": "confirmed"},
            {"step": 3, "title": "Out for Delivery", "stage_key": "out for delivery"},
            {"step": 4, "title": "At Your Door", "stage_key": "delivered"},
        ]
        status_map = {
            "waiting": (1, "Order Placed"),
            "confirmed": (2, "Farm Fresh Packed"),
            "dispatched": (2, "Farm Fresh Packed"),
            "out for delivery": (3, "Out for Delivery"),
            "delivered": (4, "At Your Door"),
        }
        current_index, current_label = status_map.get(status_clean, (1, order.status))

        milestones = []
        for m in milestones_defs:
            idx = m["step"]
            actual_time = get_time_for(m["stage_key"])
            time_display = actual_time if actual_time else "Waiting"

            milestones.append({
                "step": idx,
                "title": m["title"],
                "time": time_display,
                "is_completed": idx < current_index,
                "is_current": idx == current_index,
            })

        # Assigned Delivery Boy (Image 3)
        delivery_boy_data = None
        assignment = OrderAssignments.objects.filter(order_id=order.id).select_related('delivery_boy').first()
        if assignment and assignment.delivery_boy:
            db = assignment.delivery_boy
            delivery_boy_data = {
                "id": db.id,
                "name": db.name,
                "role": "Delivery Staff",
                "mobile": db.mobile_number,
                "vehicle_number": db.vehicle_number or "",
                "status": db.status,
            }

    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "delivery_mode": order.delivery_mode,
        "is_pickup": is_pickup,
        "status": status_clean,
        "stage_index": current_index,
        "stage_label": current_label,
        "payment_status": "pending",
        "delivery_otp": order.delivery_otp,
        "updated_at": updated_at_full,
        "delivery_boy": delivery_boy_data,
        "milestones": milestones,
        "stage_timestamps": timestamps,
    }


# 4. Function 1: Admin Stage மாற்றும் போது
def update_order_stage_and_notify(order_id, new_status):
    order = Order.objects.filter(id=order_id).first()
    if not order:
        return False, "Order not found"

    status_lower = new_status.lower()
    if status_lower not in VALID_STATUSES:
        return False, f"Invalid status: {new_status}"

    # புதிய Stage-ன் தெளிவான Date & Time-ஐ JSON-ல் சேர்க்கிறோம்:
    timestamps = order.stage_timestamps or {}
    timestamps[status_lower] = get_current_stage_timestamp()

    order.status = status_lower
    order.stage_timestamps = timestamps
    order.save(update_fields=["status", "stage_timestamps", "updated_at"])

    # WebSocket மூலம் Customer-க்கு Broadcast செய்தல்
    tracking_data = get_order_tracking_data(order.id)
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"order_{order.id}",
        {
            "type": "order_status_message",
            "event_type": "order_stage_changed",
            "data": tracking_data,
        }
    )
    logger.info(f"ws_order_stage_updated | order_id={order.id} | new_status={status_lower}")
    return True, tracking_data


# 5. Function 2: Admin Delivery Boy-ஐ Assign செய்யும் போது
def assign_delivery_boy_and_notify(order_id, delivery_boy_id):
    order = Order.objects.filter(id=order_id).first()
    if not order:
        return False, "Order not found"

    delivery_boy = DeliveryBoyProfile.objects.filter(id=delivery_boy_id).first()
    if not delivery_boy:
        return False, "Delivery boy not found"

    # adm_order_assignments டேபிளில் Record உருவாக்குதல் / அப்டேட் செய்தல்
    assignment, created = OrderAssignments.objects.update_or_create(
        order_id=order.id,
        defaults={
            "delivery_boy": delivery_boy,
            "status": "ASSIGNED",
            "created_by": "admin",
            "updated_by": "admin",
        }
    )

    # WebSocket மூலம் Customer-க்கு Delivery Boy விபரங்களை Live-ஆக அனுப்புதல்
    tracking_data = get_order_tracking_data(order.id)
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"order_{order.id}",
        {
            "type": "order_status_message",
            "event_type": "delivery_boy_assigned",
            "data": tracking_data,
        }
    )
    logger.info(f"ws_delivery_boy_assigned | order_id={order.id} | boy_id={delivery_boy_id}")
    return True, tracking_data
