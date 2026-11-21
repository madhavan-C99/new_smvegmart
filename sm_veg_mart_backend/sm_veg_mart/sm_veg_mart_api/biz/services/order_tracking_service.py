import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from django.utils import timezone
from django.db.models import Q

from biz.models.order import Order
from biz.models.order_items import OrderItems
from adm.models.order_assignments import OrderAssignments
from adm.models.delivery_boy import DeliveryBoyProfile
from adm.models.customer_profile import CustomerProfile

logger = logging.getLogger(__name__)

VALID_STATUSES = [
    "waiting", "new order", "new_order", "pending",
    "confirmed", "confirm & packing", "confirm and packing", "packing",
    "dispatched", "ready for pick up", "ready for pickup", "ready_for_pick_up", "ready for dispatch", "ready_for_dispatch", "dispatch",
    "out for delivery", "out_for_delivery", "ofd",
    "delivered", "done"
]

STAGE_KEY_MAP = {
    "waiting": "waiting",
    "new order": "waiting",
    "new_order": "waiting",
    "pending": "waiting",
    "confirmed": "confirmed",
    "confirm & packing": "confirmed",
    "confirm and packing": "confirmed",
    "packing": "confirmed",
    "ready for pickup": "dispatched",
    "ready for pick up": "dispatched",
    "ready_for_pick_up": "dispatched",
    "ready_for_dispatch": "dispatched",
    "ready for dispatch": "dispatched",
    "dispatch": "dispatched",
    "dispatched": "dispatched",
    "out for delivery": "out for delivery",
    "out_for_delivery": "out for delivery",
    "ofd": "out for delivery",
    "delivered": "delivered",
    "done": "delivered",
}


# 1. Helper: தற்போதைய நேரத்தை தெளிவான Dictionary-யாக மாற்றுதல் (time, date, display)
def get_current_stage_timestamp():
    now_ist = datetime.now(ZoneInfo("Asia/Kolkata"))
    return {
        "time": now_ist.strftime("%I:%M %p"),               # "08:35 AM"
        "date": now_ist.strftime("%d %b %Y"),               # "20 Nov 2026"
        "display": now_ist.strftime("%d %b %Y, %I:%M %p")   # "20 Nov 2026, 08:35 AM"
    }


# 2. Helper: Order ID அல்லது Order Number (#80722, 80722, SM-80722) கொண்டு Order-ஐ எடுத்தல்
def find_order_by_identifier(order_identifier):
    if not order_identifier:
        return None
    raw_str = str(order_identifier).strip()
    clean = raw_str.replace("#", "").replace("SM-", "").strip()

    # Direct match on order_number
    order = Order.objects.filter(order_number=raw_str).first()
    if order:
        return order

    # Match with # prefix (e.g. "#80722")
    order = Order.objects.filter(order_number=f"#{clean}").first()
    if order:
        return order

    # Match clean number on order_number
    order = Order.objects.filter(order_number=clean).first()
    if order:
        return order

    # If numeric, check database Primary Key id
    if clean.isdigit():
        order = Order.objects.filter(id=int(clean)).first()
        if order:
            return order

    # Case-insensitive substring match
    order = Order.objects.filter(order_number__icontains=clean).first()
    return order


# 3. Single Order டிராக்கிங் விபரங்களை எடுக்கும் Helper (Pickup vs Express/Scheduled)
def get_order_tracking_data(order_identifier):
    order = find_order_by_identifier(order_identifier)
    if not order:
        return None

    status_clean = (order.status or "").lower().strip()
    is_pickup = "pickup" in (order.delivery_mode or "").lower()
    timestamps = order.stage_timestamps or {}

    time_ist = order.updated_at.astimezone(ZoneInfo("Asia/Kolkata"))
    updated_at_full = time_ist.strftime("%d %b %Y, %I:%M %p")

    def get_time_for(stage_key):
        entry = timestamps.get(stage_key)
        if isinstance(entry, dict):
            return entry.get("time")
        elif isinstance(entry, str):
            return entry
        return None

    if is_pickup:
        milestones_defs = [
            {"step": 1, "title": "New Order", "stage_key": "waiting"},
            {"step": 2, "title": "Confirm & Packing", "stage_key": "confirmed"},
            {"step": 3, "title": "Ready for pick up", "stage_key": "dispatched"},
            {"step": 4, "title": "Done", "stage_key": "delivered"},
        ]
        status_map = {
            "waiting": (1, "New Order", "Pending"),
            "new order": (1, "New Order", "Pending"),
            "new_order": (1, "New Order", "Pending"),
            "pending": (1, "New Order", "Pending"),
            "confirmed": (2, "Confirm & Packing", "Confirmed"),
            "confirm & packing": (2, "Confirm & Packing", "Confirmed"),
            "confirm and packing": (2, "Confirm & Packing", "Confirmed"),
            "packing": (2, "Confirm & Packing", "Confirmed"),
            "ready for pick up": (3, "Ready for pick up", "Ready for pick up"),
            "ready for pickup": (3, "Ready for pick up", "Ready for pick up"),
            "ready_for_pick_up": (3, "Ready for pick up", "Ready for pick up"),
            "dispatched": (3, "Ready for pick up", "Ready for pick up"),
            "out for delivery": (3, "Ready for pick up", "Ready for pick up"),
            "delivered": (4, "Done", "Delivered"),
            "done": (4, "Done", "Delivered"),
        }
        step_info = status_map.get(status_clean, (1, order.status, order.status))
        current_index, current_label, standard_status = step_info[0], step_info[1], step_info[2]

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
        milestones_defs = [
            {"step": 1, "title": "Order Placed", "stage_key": "waiting"},
            {"step": 2, "title": "Farm Fresh Packed", "stage_key": "confirmed"},
            {"step": 3, "title": "Out for Delivery", "stage_key": "out for delivery"},
            {"step": 4, "title": "At Your Door", "stage_key": "delivered"},
        ]
        status_map = {
            "waiting": (1, "Order Placed", "Pending"),
            "new order": (1, "Order Placed", "Pending"),
            "new_order": (1, "Order Placed", "Pending"),
            "pending": (1, "Order Placed", "Pending"),
            "confirmed": (2, "Farm Fresh Packed", "Confirmed"),
            "confirm & packing": (2, "Farm Fresh Packed", "Confirmed"),
            "confirm and packing": (2, "Farm Fresh Packed", "Confirmed"),
            "packing": (2, "Farm Fresh Packed", "Confirmed"),
            "dispatched": (2, "Farm Fresh Packed", "Confirmed"),
            "out for delivery": (3, "Out for Delivery", "OutForDelivery"),
            "out_for_delivery": (3, "Out for Delivery", "OutForDelivery"),
            "ofd": (3, "Out for Delivery", "OutForDelivery"),
            "delivered": (4, "At Your Door", "Delivered"),
            "done": (4, "At Your Door", "Delivered"),
        }
        step_info = status_map.get(status_clean, (1, order.status, order.status))
        current_index, current_label, standard_status = step_info[0], step_info[1], step_info[2]

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

    # Format items
    items_list = []
    try:
        for itm in order.items.select_related('product').all():
            img_url = ""
            if getattr(itm.product, 'product_img', None):
                try:
                    img_url = itm.product.product_img.url
                except Exception:
                    img_url = str(itm.product.product_img)
            items_list.append({
                "name": itm.product.name,
                "image": img_url,
                "weight": itm.weight,
                "qty": itm.quantity,
                "price": str(itm.total_price),
            })
    except Exception:
        pass

    return {
        "id": order.id,
        "order_id": f"SMV-{order.order_date.strftime('%Y%m%d') if order.order_date else 'ORDER'}-{order.id:03d}",
        "order_number": order.order_number,
        "delivery_mode": order.delivery_mode,
        "is_pickup": is_pickup,
        "status": order.status,
        "status_clean": status_clean,
        "standard_status": standard_status,
        "stage_index": current_index,
        "stage_label": current_label,
        "payment_status": "pending",
        "delivery_otp": order.delivery_otp,
        "updated_at": updated_at_full,
        "delivery_boy": delivery_boy_data,
        "milestones": milestones,
        "stage_timestamps": timestamps,
        "items": items_list,
        "total_amount": str(order.total_amount),
    }


# 4. User-Level Active Orders எடுக்கும் Helper (Customer My Orders Page / useOrderTracking)
def get_user_active_orders_data(user_id):
    try:
        user_prof = CustomerProfile.objects.filter(Q(id=user_id) | Q(user_id=user_id)).first()
        if not user_prof:
            return []

        cutoff_time = timezone.now() - timedelta(minutes=10)
        active_statuses = [
            'Pending', 'Confirmed', 'Out For Delivery', 'OutForDelivery', 'Dispatched',
            'waiting', 'confirmed', 'out for delivery', 'dispatched', 'ready for pick up'
        ]
        orders = Order.objects.filter(user_id=user_prof.id).filter(
            Q(status__in=active_statuses) | Q(status__in=['Delivered', 'delivered'], updated_at__gte=cutoff_time)
        ).order_by('-id')

        all_orders = []
        for ord_obj in orders:
            address_obj = ord_obj.address
            address_data = {
                "name": address_obj.name if address_obj else (user_prof.name or "N/A"),
                "mobile": address_obj.mobile if address_obj else "",
                "category": getattr(address_obj, 'category', '') if address_obj else "",
                "address_line1": address_obj.address_line1 if address_obj else "",
                "address_line2": address_obj.address_line2 if address_obj else "",
                "city": address_obj.city if address_obj else "",
                "state": address_obj.state if address_obj else "",
                "country": getattr(address_obj, 'country', 'India') if address_obj else "India",
                "pincode": address_obj.pincode if address_obj else ""
            }

            raw_status = (ord_obj.status or "").lower().strip()
            if raw_status in ['pending', 'waiting', 'new order', 'new_order']:
                display_status = 'Pending'
            elif raw_status in ['confirmed', 'confirm & packing', 'confirm and packing', 'packing']:
                display_status = 'Confirmed'
            elif raw_status in ['out for delivery', 'out_for_delivery', 'dispatched', 'ready for pickup', 'ready for pick up']:
                display_status = 'OutForDelivery'
            elif raw_status in ['delivered', 'done']:
                display_status = 'Delivered'
            else:
                display_status = ord_obj.status

            items = []
            for itm in ord_obj.items.select_related('product').all():
                img_url = ""
                if getattr(itm.product, 'product_img', None):
                    try:
                        img_url = itm.product.product_img.url
                    except Exception:
                        img_url = str(itm.product.product_img)
                items.append({
                    "name": itm.product.name,
                    "image": img_url,
                    "weight": itm.weight,
                    "qty": itm.quantity,
                    "price": str(itm.total_price)
                })

            all_orders.append({
                "order_id": ord_obj.id,
                "order_number": ord_obj.order_number,
                "item_counts": len(items),
                "status": display_status,
                "raw_status": ord_obj.status,
                "address": address_data,
                "grand_total": str(ord_obj.total_amount),
                "items": items,
                "delivery_mode": ord_obj.delivery_mode,
                "delivery_otp": ord_obj.delivery_otp,
                "stage_timestamps": ord_obj.stage_timestamps or {},
            })
        return all_orders
    except Exception as e:
        logger.error(f"Error fetching user active orders for user {user_id}: {e}")
        return []


# 5. Broadcast Helper: All Connected Sockets (Single Order + User Orders)-க்கு ஒரே நேரத்தில் அனுப்புதல்
def broadcast_order_update_to_all_channels(order, tracking_data, event_type="order_stage_changed"):
    channel_layer = get_channel_layer()
    if not channel_layer or not order:
        return

    clean_num = str(order.order_number or "").replace("#", "").replace("SM-", "").strip()

    # 1. Single order tracking rooms
    groups_to_notify = [
        f"order_{order.id}",
        f"order_{clean_num}",
        f"order_num_{clean_num}",
    ]
    if order.order_number:
        groups_to_notify.append(f"order_{order.order_number.strip()}")

    for grp in set(groups_to_notify):
        if grp:
            try:
                async_to_sync(channel_layer.group_send)(
                    grp,
                    {
                        "type": "order_status_message",
                        "event_type": event_type,
                        "data": tracking_data,
                    }
                )
            except Exception as e:
                logger.warning(f"Error broadcasting to group {grp}: {e}")

    # 2. Customer user active orders rooms (f"order_user_{user_id}")
    try:
        user_prof = order.user
        if user_prof:
            user_orders_data = get_user_active_orders_data(user_prof.id)
            user_groups = [f"order_user_{user_prof.id}"]
            if getattr(user_prof, 'user_id', None):
                user_groups.append(f"order_user_{user_prof.user_id}")

            for ugrp in set(user_groups):
                try:
                    async_to_sync(channel_layer.group_send)(
                        ugrp,
                        {
                            "type": "send_status_update",
                            "data": {"orders": user_orders_data}
                        }
                    )
                except Exception as e:
                    logger.warning(f"Error broadcasting to user group {ugrp}: {e}")
    except Exception as e:
        logger.warning(f"Error broadcasting user active orders: {e}")


# 6. Admin Stage மாற்றும் போது (Called from update_order_status_service)
def update_order_stage_and_notify(order_id, new_status):
    order = find_order_by_identifier(order_id)
    if not order:
        return False, f"Order {order_id} not found"

    status_str = str(new_status).strip()
    status_lower = status_str.lower()
    stage_key = STAGE_KEY_MAP.get(status_lower, status_lower)

    # Record stage timestamp
    timestamps = order.stage_timestamps or {}
    timestamps[stage_key] = get_current_stage_timestamp()

    order.status = status_str
    order.stage_timestamps = timestamps
    order.save(update_fields=["status", "stage_timestamps", "updated_at"])

    tracking_data = get_order_tracking_data(order.id)
    broadcast_order_update_to_all_channels(order, tracking_data, event_type="order_stage_changed")
    logger.info(f"ws_order_stage_updated | order_id={order.id} | new_status={status_str} | stage_key={stage_key}")
    return True, tracking_data


# 7. Admin Delivery Boy-ஐ Assign செய்யும் போது (Called from delivery_agent_service)
def assign_delivery_boy_and_notify(order_id, delivery_boy_id):
    order = find_order_by_identifier(order_id)
    if not order:
        return False, "Order not found"

    delivery_boy = DeliveryBoyProfile.objects.filter(id=delivery_boy_id).first()
    if not delivery_boy:
        return False, "Delivery boy not found"

    # adm_order_assignments record update
    assignment, created = OrderAssignments.objects.update_or_create(
        order_id=order.id,
        defaults={
            "delivery_boy": delivery_boy,
            "status": "ASSIGNED",
            "created_by": "admin",
            "updated_by": "admin",
        }
    )

    tracking_data = get_order_tracking_data(order.id)
    broadcast_order_update_to_all_channels(order, tracking_data, event_type="delivery_boy_assigned")
    logger.info(f"ws_delivery_boy_assigned | order_id={order.id} | boy_id={delivery_boy_id}")
    return True, tracking_data
