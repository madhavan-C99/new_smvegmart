import logging
import csv
from io import StringIO
from datetime import timedelta
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.exceptions import ValidationError, APIException

from biz.models.order import Order
from biz.models.order_items import OrderItems
from adm.models.order_assignments import OrderAssignments
from adm.models.notification import Notification
from adm.models.delete_base_model import SafeDeleteModel
from adm.utils.time_utils import (
    get_ist_now,
    get_ist_today,
    to_ist,
    format_12h_datetime,
    format_12h_time,
)
from biz.services.order_tracking_service import update_order_stage_and_notify
from .reminder_service import broadcast_reminders_data
from ..tasks import ordertask

logger = logging.getLogger('django')


def notify_order_subscribers():
    """
    Broadcasts real-time order updates to all connected WebSockets.
    Also triggers real-time recalculation and broadcast for Operational Reminders.
    """
    try:
        ordertask.fetch_all_order_task.call_local()
    except Exception as e:
        logger.warning(f"Could not notify order subscribers: {e}")

    try:
        broadcast_reminders_data()
    except Exception as e:
        logger.warning(f"Could not notify reminder subscribers: {e}")



def get_all_orders_orm():
    """
    Fetches all orders from biz.models.Order, joining user, address, items, and products.
    Returns structured data for the frontend table and details drawer.
    """
    queryset = (
        Order.objects
        .select_related(
            'address', 'user', 'user__user', 'delivery_slot',
            'order_config_day_timings',
            'order_config_day_timings__timing',
            'order_config_day_timings__day',
            'order_config_day_timings__order_config',
        )
        .prefetch_related('items__product')
        .all()
        .order_by('-id')
    )

    orders_data = []
    avatar_colors = ["#2f853d", "#6366f1", "#d97706", "#8b5cf6", "#0d9488", "#e11d48"]

    # Pre-fetch all delivery assignments mapped by order_id
    assignments_map = {}
    try:
        assignments = OrderAssignments.objects.select_related('delivery_boy').all()
        for oa in assignments:
            assignments_map[oa.order_id] = oa
    except Exception as e:
        logger.warning(f"Could not load order assignments: {e}")

    for index, order in enumerate(queryset, start=1):
        # 1. Customer information
        cust_name = "Customer"
        cust_phone = ""
        cust_address = "Address Pending"

        if order.address:
            cust_name = order.address.name or cust_name
            cust_phone = order.address.mobile or ""
            parts = [p for p in [order.address.address_line1, order.address.address_line2, order.address.landmark] if p and str(p).strip()]
            city_state = ", ".join([str(c).strip() for c in [order.address.city, order.address.state] if c and str(c).strip()])
            pincode = str(order.address.pincode).strip() if order.address.pincode else ""
            if city_state and pincode:
                parts.append(f"{city_state} - {pincode}")
            elif city_state:
                parts.append(city_state)
            elif pincode:
                parts.append(pincode)
            cust_address = ", ".join(parts) if parts else "Address Pending"
        elif order.user:
            cust_name = getattr(order.user, 'name', cust_name) or cust_name
            if hasattr(order.user, 'user') and order.user.user:
                cust_phone = getattr(order.user.user, 'mobile', '') or ""

        # Initials
        name_parts = cust_name.strip().split()
        initials = "".join([part[0] for part in name_parts[:2]]).upper() if name_parts else "CU"
        avatar_bg = avatar_colors[index % len(avatar_colors)]

        # 2. Basket items
        basket = []
        item_names = []
        for item in order.items.all():
            p_name = item.product.name if item.product else "Item"
            item_names.append(p_name)

            img_url = None
            if item.product and item.product.product_img:
                try:
                    img_url = item.product.product_img.url
                except Exception:
                    img_url = str(item.product.product_img)

                if getattr(settings, 'CLOUD_FRONT_URL', None) and not img_url.startswith('http'):
                    img_url = f"{settings.CLOUD_FRONT_URL.rstrip('/')}/{img_url.lstrip('/')}"

            item_price = float(item.total_price) if item.total_price else (float(item.unit_price) * item.quantity if item.unit_price else 0.0)

            basket.append({
                "id": item.id,
                "name": p_name,
                "weight": item.weight or "",
                "pack": f"{item.weight or ''} • Qty: {item.quantity}".strip(),
                "quantity": item.quantity,
                "price": item_price,
                "image": img_url or "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=120",
            })

        items_preview = ", ".join(item_names[:3])
        if len(item_names) > 3:
            items_preview += "..."

        # 3. Delivery badge & date
        now_ist = get_ist_now()
        today_date = get_ist_today()
        yesterday_date = today_date - timedelta(days=1)

        order_dt = to_ist(order.created_at) if order.created_at else now_ist
        order_date = order_dt.date()
        time_str = format_12h_time(order_dt)

        if order_date == today_date:
            created_at_label = f"Today, {time_str}"
            date_formatted = f"Placed Today, {order_dt.strftime('%d %b at')} {time_str}"
            relative_day = "today"
        elif order_date == yesterday_date:
            created_at_label = f"Yesterday, {time_str}"
            date_formatted = f"Placed Yesterday, {order_dt.strftime('%d %b at')} {time_str}"
            relative_day = "yesterday"
        else:
            created_at_label = f"{order_dt.strftime('%d %b')}, {time_str}"
            date_formatted = f"Placed on {order_dt.strftime('%d %b %Y at')} {time_str}"
            relative_day = "past"

        iso_date = order_date.strftime("%Y-%m-%d")

        # Step 1: Real order placement time
        created_time_str = time_str
        updated_time_str = format_12h_time(order.updated_at) if order.updated_at else time_str

        # Lifecycle Timestamps & 25-Min SLA Calculation:
        # Step 1 is the time customer placed the order.
        # When admin accepts the order, it moves to "Confirm & Packing" (Step 2).
        # The 25-minute delivery SLA calculates strictly FROM acceptance time (Step 2)!
        status_lower = str(order.status or "").lower().strip()
        is_new_order = status_lower in ["pending", "new_order", "new order", "waiting"]

        if is_new_order:
            # Not yet accepted by admin - steps 2 to 5 are waiting
            accepted_time_str = None
            target_delivery_time_str = format_12h_time(order_dt + timedelta(minutes=25))
            lifecycle_timestamps = {
                1: created_time_str,
                2: None,
                3: None,
                4: None,
                5: None,
            }
        else:
            # Admin has accepted the order!
            if order.updated_at and order.updated_at > order.created_at:
                accepted_dt = to_ist(order.updated_at)
            else:
                accepted_dt = order_dt + timedelta(minutes=5)

            accepted_time_str = format_12h_time(accepted_dt)
            target_delivery_time_str = format_12h_time(accepted_dt + timedelta(minutes=25))

            # Sequential Dispatch Milestones strictly from acceptance time (Step 2):
            # Step 2: Confirm & Packing (0m from acceptance)
            # Step 3: Ready for Dispatch (+7m packing complete)
            # Step 4: Out for Delivery (+14m picked up by rider)
            # Step 5: Done / Delivered (+25m delivered within 25-min SLA!)
            lifecycle_timestamps = {
                1: created_time_str,
                2: accepted_time_str,
                3: format_12h_time(accepted_dt + timedelta(minutes=7)),
                4: format_12h_time(accepted_dt + timedelta(minutes=14)),
                5: target_delivery_time_str,
            }


        delivery_mode_val = order.delivery_mode or "Express 25m"
        mode_lower = delivery_mode_val.lower()
        is_mode_pickup = ("pickup" in mode_lower or "shop" in mode_lower or "self" in mode_lower)
        is_mode_scheduled = ("schedule" in mode_lower)

        if is_mode_pickup:
            delivery_mode_val = "Shop Pickup"
        elif is_mode_scheduled:
            delivery_mode_val = "Scheduled Delivery"
        else:
            delivery_mode_val = "Express 25m"

        # Determine slot & timing information
        slot_id = None
        slot_title = ""
        slot_tag = ""
        slot_label = ""
        s_str = ""
        e_str = ""
        time_window = ""
        ocdt = getattr(order, 'order_config_day_timings', None)

        # 1. Primary Priority: Direct mapping from OrderConfigDayTimings
        if ocdt and getattr(ocdt, 'timing', None):
            timing = ocdt.timing
            slot_id = ocdt.id
            slot_label = getattr(timing, 'slot_label', '') or ''
            s_str = format_12h_time(timing.start_time) if getattr(timing, 'start_time', None) else ""
            e_str = format_12h_time(timing.end_time) if getattr(timing, 'end_time', None) else ""
            time_window = f"{s_str} - {e_str}" if (s_str and e_str) else slot_label
            slot_title = f"{slot_label} ({time_window})" if (slot_label and time_window and slot_label != time_window) else (slot_label or time_window)

        # 2. Secondary Priority: DeliverySlots table
        elif order.delivery_slot:
            slot_id = order.delivery_slot.id
            slot_title = getattr(order.delivery_slot, 'slot_title', None) or getattr(order.delivery_slot, 'slot_name', None) or "Standard Slot"
            slot_tag = getattr(order.delivery_slot, 'slot_tag', None) or ""
            if slot_tag and slot_tag.lower() not in slot_title.lower():
                slot_label = f"{slot_title} • {slot_tag}"
            else:
                slot_label = slot_title

            if getattr(order.delivery_slot, 'start_time', None):
                s_str = order.delivery_slot.start_time.strftime("%I:%M %p")
            if getattr(order.delivery_slot, 'end_time', None):
                e_str = order.delivery_slot.end_time.strftime("%I:%M %p")
            time_window = f"{s_str} - {e_str}" if (s_str and e_str) else slot_title

        # 3. Third Priority: STRICTLY map to configured OrderConfigDayTimings / DeliveryTimings slots only:
        # Configured slots from Delivery Configuration:
        # - Early Morning: 06:00 AM - 08:00 AM
        # - Morning • Popular: 08:00 AM - 10:00 AM
        # - Late Morning: 10:00 AM - 12:00 PM
        # - Evening: 04:00 PM - 06:00 PM
        # - Night: 06:00 PM - 08:00 PM
        elif is_mode_pickup or is_mode_scheduled:
            h = order_dt.hour
            if h < 8:
                slot_label = "Early Morning"
                s_str = "06:00 AM"
                e_str = "08:00 AM"
            elif h < 10:
                slot_label = "Morning • Popular"
                s_str = "08:00 AM"
                e_str = "10:00 AM"
            elif h < 14:
                slot_label = "Late Morning"
                s_str = "10:00 AM"
                e_str = "12:00 PM"
            elif h < 18:
                slot_label = "Evening"
                s_str = "04:00 PM"
                e_str = "06:00 PM"
            else:
                slot_label = "Night"
                s_str = "06:00 PM"
                e_str = "08:00 PM"

            time_window = f"{s_str} - {e_str}"
            slot_title = f"{slot_label} ({time_window})"

        # Resolve display date for slot
        delivery_date_str = str(order.delivery_date) if order.delivery_date else (iso_date if iso_date else "")
        if order.delivery_date:
            delivery_date_display = "Today" if order.delivery_date == today_date else order.delivery_date.strftime("%d %b %Y")
        elif iso_date:
            delivery_date_display = relative_day or "Today"
        else:
            delivery_date_display = "Today"

        full_slot_display = f"{slot_label} ({time_window})" if (slot_label and time_window and slot_label != time_window) else time_window
        formatted_slot_str = f"{delivery_date_display}, {full_slot_display}" if full_slot_display else delivery_date_display

        slot_payload = {
            "id": slot_id,
            "title": slot_title,
            "tag": slot_tag,
            "slot_label": slot_label,
            "start_time": s_str,
            "end_time": e_str,
            "time_window": time_window,
            "full_display": full_slot_display,
            "date": delivery_date_str,
            "date_display": delivery_date_display,
            "formatted_slot": formatted_slot_str,
            "day_name": getattr(getattr(ocdt, 'day', None), 'day_name', '') if ocdt else "",
            "order_config_id": getattr(ocdt, 'id', None) if ocdt else None,
        }

        # Format delivery badge and slot_timing_display according to mode
        if is_mode_pickup:
            delivery_badge = f"Pickup: {full_slot_display}" if full_slot_display else "Shop Pickup"
            slot_timing_display = formatted_slot_str
        elif is_mode_scheduled:
            delivery_badge = f"Slot: {full_slot_display}" if full_slot_display else "Scheduled Delivery"
            slot_timing_display = formatted_slot_str
        else:
            delivery_badge = "Instant Express (25 Mins)"
            slot_timing_display = f"Target Delivery: {target_delivery_time_str} (Within 25 mins)"

        is_order_ofd = status_lower in ['out_for_delivery', 'out for delivery', 'ofd']
        has_oa = order.id in assignments_map and assignments_map[order.id].delivery_boy
        oa_status = assignments_map[order.id].status if has_oa else ""
        is_trip_ofd = (is_order_ofd or oa_status == 'OUT_FOR_DELIVERY')

        assigned_agent_payload = None
        if has_oa:
            boy = assignments_map[order.id].delivery_boy
            assigned_agent_payload = {
                "id": boy.id,
                "name": boy.name,
                "phone": boy.mobile_number,
                "vehicle_number": boy.vehicle_number or "",
                "status": "Busy" if is_trip_ofd else "Available",
                "is_available": not is_trip_ofd,
                "assignment_status": oa_status,
            }

        orders_data.append({
            "s_no": index,
            "id": order.id,
            "order_id": order.order_number or f"SMV-{order.id}",
            "order_number": order.order_number or f"SMV-{order.id}",
            "customer": {
                "name": cust_name,
                "phone": cust_phone,
                "avatar": initials,
                "avatarBg": avatar_bg,
                "address": cust_address,
            },
            "created_at": created_at_label,
            "placed_at": format_12h_datetime(order.created_at),
            "created_time": created_time_str,

            "accepted_time": accepted_time_str,
            "target_delivery_time": target_delivery_time_str,
            "updated_time": updated_time_str,
            "order_date": iso_date,
            "relative_day": relative_day,
            "lifecycle_timestamps": lifecycle_timestamps,
            "date_formatted": date_formatted,
            "items_count": len(basket),
            "items_preview": items_preview or "Fresh Produce",
            "amount": (sum(float(i.get("price", 0.0) or 0.0) for i in basket) + float(order.delivery_charge or 0.0)) if basket else (float(order.total_amount) if order.total_amount else 0.0),
            "subtotal": sum(float(i.get("price", 0.0) or 0.0) for i in basket) if basket else (float(order.total_amount) if order.total_amount else 0.0),
            "delivery_charge": float(order.delivery_charge or 0.0),
            "delivery_mode": delivery_mode_val,
            "delivery_badge": delivery_badge,
            "delivery_date": str(order.delivery_date) if order.delivery_date else (iso_date if iso_date else None),
            "delivery_date_display": delivery_date_display,
            "slot_timing_display": slot_timing_display,
            "slot": slot_payload,
            "status": order.status or "Pending",
            "payment_status": order.payment_status,
            "rider": assigned_agent_payload,
            "delivery_agent": assigned_agent_payload,
            "basket": basket,
        })

    return orders_data


def fetch_one_order_service(order_id):
    try:
        order = Order.objects.select_related('address', 'user', 'user__user').prefetch_related('items__product').get(id=order_id)
    except Order.DoesNotExist:
        raise ValidationError({"detail": f"Order with ID {order_id} not found."})

    orders = get_all_orders_orm()
    for o in orders:
        if o["id"] == order.id:
            return o
    return {"id": order.id, "order_id": order.order_number, "status": order.status}


def update_order_status_service(order_id, status):
    try:
        order = Order.objects.get(id=order_id)
        order.status = status
        order.save()

        norm_status = str(status).lower().strip()
        if norm_status not in ['new order', 'new_order', 'pending', 'placed']:
            Notification.objects.filter(order_id=order.id).update(is_read=True)

        assignment = OrderAssignments.objects.filter(order_id=order.id).first()
        if assignment:
            if norm_status in ['delivered', 'done']:
                assignment.status = 'DELIVERED'
                assignment.delivered_at = timezone.now()
                assignment.save(update_fields=['status', 'delivered_at'])

                boy = assignment.delivery_boy
                if boy:
                    has_other_active = OrderAssignments.objects.filter(
                        delivery_boy=boy,
                        status__in=['ASSIGNED', 'OUT_FOR_DELIVERY']
                    ).exclude(order_id=order.id).exists()
                    if not has_other_active:
                        boy.status = 'online'
                        boy.is_available = True
                        boy.save(update_fields=['status', 'is_available'])

            elif norm_status in ['cancelled', 'rejected']:
                assignment.status = 'CANCELLED'
                assignment.save(update_fields=['status'])

                boy = assignment.delivery_boy
                if boy:
                    has_other_active = OrderAssignments.objects.filter(
                        delivery_boy=boy,
                        status__in=['ASSIGNED', 'OUT_FOR_DELIVERY']
                    ).exclude(order_id=order.id).exists()
                    if not has_other_active:
                        boy.status = 'online'
                        boy.is_available = True
                        boy.save(update_fields=['status', 'is_available'])

            elif norm_status in ['out_for_delivery', 'out for delivery', 'ofd']:
                assignment.status = 'OUT_FOR_DELIVERY'
                assignment.save(update_fields=['status'])

                # Rider is now actively on delivery trip -> moves to busy
                boy = assignment.delivery_boy
                if boy:
                    boy.status = 'busy'
                    boy.is_available = False
                    boy.save(update_fields=['status', 'is_available'])

        notify_order_subscribers()

        # Real-time Customer Tracking WebSocket trigger (BIZ App)
        try:
            status_map = {
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
                "dispatched": "dispatched",
                "out for delivery": "out for delivery",
                "out_for_delivery": "out for delivery",
                "ofd": "out for delivery",
                "delivered": "delivered",
                "done": "delivered",
            }
            mapped_status = status_map.get(norm_status, status)
            if mapped_status:
                update_order_stage_and_notify(order.id, mapped_status)
        except Exception as ws_err:
            logger.warning(f"Could not trigger customer order tracking websocket: {ws_err}")

        return {"id": order.id, "order_number": order.order_number, "status": order.status}
    except Order.DoesNotExist:
        raise ValidationError({"detail": f"Order with ID {order_id} not found."})


def cancel_order_service(order_id, reason=""):
    try:
        order = Order.objects.get(id=order_id)
        order.status = "Cancelled"
        order.save()

        assignment = OrderAssignments.objects.filter(order_id=order.id).first()
        if assignment:
            assignment.status = 'CANCELLED'
            assignment.save(update_fields=['status'])
            boy = assignment.delivery_boy
            if boy:
                has_other_active = OrderAssignments.objects.filter(
                    delivery_boy=boy,
                    status__in=['ASSIGNED', 'OUT_FOR_DELIVERY']
                ).exclude(order_id=order.id).exists()
                if not has_other_active:
                    boy.status = 'online'
                    boy.is_available = True
                    boy.save(update_fields=['status', 'is_available'])

        notify_order_subscribers()
        return {"id": order.id, "order_number": order.order_number, "status": "Cancelled", "reason": reason}
    except Order.DoesNotExist:
        raise ValidationError({"detail": f"Order with ID {order_id} not found."})


def delete_order_item_service(order_id, item_id):
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        raise ValidationError({"detail": f"Order with ID {order_id} not found."})

    try:
        item = OrderItems.objects.get(id=item_id, order=order)
    except OrderItems.DoesNotExist:
        raise ValidationError({"detail": f"Item with ID {item_id} not found in Order #{order_id}."})

    # Guard: An order must contain at least one item. Zero items are not permitted!
    if order.items.count() <= 1:
        raise ValidationError({"detail": "Cannot remove the only item. An order must contain at least one item."})

    # Delete item safely
    try:
        item.save_delete()
    except Exception:
        super(SafeDeleteModel, item).delete()

    # Recalculate remaining total
    remaining_items = order.items.all()
    new_total = sum([
        float(i.total_price) if i.total_price else (float(i.unit_price) * i.quantity if i.unit_price else 0.0)
        for i in remaining_items
    ])
    order.total_amount = new_total
    order.save()

    # Broadcast to all connected clients
    notify_order_subscribers()

    return {
        "order_id": order.id,
        "deleted_item_id": item_id,
        "new_total": new_total,
        "remaining_items_count": remaining_items.count()
    }


def export_orders_csv_service():
    orders = get_all_orders_orm()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["#", "Order ID", "Customer Name", "Phone", "Date & Time", "Items Count", "Amount (INR)", "Delivery Mode", "Status"])

    for o in orders:
        writer.writerow([
            o.get("s_no"),
            o.get("order_id"),
            o.get("customer", {}).get("name"),
            o.get("customer", {}).get("phone"),
            o.get("created_at"),
            o.get("items_count"),
            o.get("amount"),
            o.get("delivery_mode"),
            o.get("status"),
        ])

    response = HttpResponse(output.getvalue(), content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="vegmart_orders.csv"'
    return response


# ==============================================================================
# BIZ ➔ ADM REAL-TIME INTEGRATION ENDPOINTS
# Call these single-line functions from the BIZ app whenever customers act
# ==============================================================================

def notify_new_order_placed(order_id):
    """
    Called by BIZ when a customer successfully places an order.
    1. Creates an unread notification record in adm_notifications.
    2. Broadcasts real-time to all connected Admin dashboards & reminders.
    """
    try:
        order = Order.objects.select_related('user', 'address').filter(id=order_id).first()
        if not order:
            return False

        if getattr(order, 'user', None):
            try:
                cp = order.user
                if not cp.is_active:
                    cp.is_active = True
                    cp.save(update_fields=['is_active'])
                if hasattr(cp, 'user') and cp.user:
                    cp.user.is_active = True
                    cp.user.last_login = timezone.now()
                    cp.user.save(update_fields=['is_active', 'last_login'])
            except Exception:
                pass

        cust_name = "Customer"
        if order.address and order.address.name:
            cust_name = order.address.name
        elif order.user and hasattr(order.user, 'name'):
            cust_name = order.user.name or cust_name

        existing_notif = Notification.objects.filter(order_id=order.id).first()
        if not existing_notif:
            mode = str(order.delivery_mode or "").lower()
            if "pickup" in mode:
                title = "Incoming Pickup Order"
            elif "schedule" in mode:
                title = "Incoming Scheduled Order"
            else:
                title = "Incoming Express Order"

            order_no = order.order_number or f"SMV-{order.id}"
            message = f"New order {order_no} placed by {cust_name}"

            Notification.objects.create(
                order_id=order.id,
                title=title,
                message=message,
                is_read=False,
                created_by="system",
                updated_by="system"
            )

        # Broadcast live to all open Admin tabs (orders table, notification bell, SLA reminder)
        notify_order_subscribers()
        logger.info(f"notify_new_order_placed | order_id={order.id} | Broadcast sent to ADM.")
        return True
    except Exception as e:
        logger.error(f"Error in notify_new_order_placed: {e}", exc_info=True)
        return False


def notify_customer_cancelled_order(order_id, reason="Customer cancelled from app"):
    """
    Called by BIZ when a customer cancels an order before dispatch.
    1. Updates order status to Cancelled.
    2. Frees any assigned rider back to Available.
    3. Adds high-priority notification and broadcasts to Admin.
    """
    try:
        order = Order.objects.filter(id=order_id).first()
        if not order:
            return False

        order.status = "Cancelled"
        order.save(update_fields=['status', 'updated_at'])

        # Free rider if one was assigned
        assignment = OrderAssignments.objects.filter(order_id=order.id).first()
        if assignment:
            assignment.status = 'CANCELLED'
            assignment.save(update_fields=['status'])
            boy = assignment.delivery_boy
            if boy:
                has_active = OrderAssignments.objects.filter(
                    delivery_boy=boy,
                    status__in=['ASSIGNED', 'OUT_FOR_DELIVERY']
                ).exclude(order_id=order.id).exists()
                if not has_active:
                    boy.status = 'online'
                    boy.is_available = True
                    boy.save(update_fields=['status', 'is_available'])

        Notification.objects.create(
            order_id=order.id,
            title="Order Cancelled by Customer",
            message=f"Order #{order.order_number} was cancelled. Reason: {reason}",
            is_read=False,
            created_by="customer",
        )

        notify_order_subscribers()
        logger.info(f"notify_customer_cancelled_order | order_id={order.id} | Broadcast sent to ADM.")
        return True
    except Exception as e:
        logger.error(f"Error in notify_customer_cancelled_order: {e}", exc_info=True)
        return False


def notify_payment_status_changed(order_id, payment_status=True):
    """
    Called by BIZ when online payment succeeds (Razorpay / UPI callback).
    """
    try:
        order = Order.objects.filter(id=order_id).first()
        if not order:
            return False

        order.payment_status = payment_status
        order.save(update_fields=['payment_status', 'updated_at'])

        notify_order_subscribers()
        logger.info(f"notify_payment_status_changed | order_id={order.id} | payment_status={payment_status}")
        return True
    except Exception as e:
        logger.error(f"Error in notify_payment_status_changed: {e}", exc_info=True)
        return False

