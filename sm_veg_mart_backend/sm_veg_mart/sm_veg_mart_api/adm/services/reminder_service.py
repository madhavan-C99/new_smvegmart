import logging
import re
from datetime import timedelta
from django.utils import timezone as dj_timezone
from django.conf import settings
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from biz.models.order import Order
from biz.models.order_items import OrderItems
from adm.models.order_assignments import OrderAssignments
from adm.models.products import Product
from adm.utils.time_utils import (
    get_ist_now,
    get_ist_today,
    to_ist,
    format_12h_datetime,
    format_12h_time,
    parse_12h_time,
)


logger = logging.getLogger('django')


def extract_slot_hour_minute(slot_string):
    """
    Parses slot strings like '06:30 AM - 08:30 AM', '4-6 PM', '07:00 AM' into (hour, minute, label)
    """
    if not slot_string:
        return 7, 0, "07:00 AM"

    clean = str(slot_string)
    match_with_min = re.search(r'(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)', clean, re.I)
    if match_with_min:
        hour = int(match_with_min.group(1))
        minute = int(match_with_min.group(2))
        meridiem = match_with_min.group(3).upper()
        if meridiem == 'PM' and hour < 12:
            hour += 12
        elif meridiem == 'AM' and hour == 12:
            hour = 0
        return hour, minute, match_with_min.group(0)

    match_hour_only = re.search(r'(\d{1,2})\s*(AM|PM|am|pm)', clean, re.I)
    if match_hour_only:
        hour = int(match_hour_only.group(1))
        meridiem = match_hour_only.group(2).upper()
        if meridiem == 'PM' and hour < 12:
            hour += 12
        elif meridiem == 'AM' and hour == 12:
            hour = 0
        return hour, 0, match_hour_only.group(0)

    return 7, 0, "07:00 AM"


_cleared_all = False
_cleared_ids = set()


def clear_all_reminders_service():
    """
    Clears all active reminder messages.
    """
    global _cleared_all, _cleared_ids
    _cleared_all = True
    _cleared_ids.clear()
    broadcast_reminders_data()
    return {"status": "SUCCESS", "message": "All reminder messages cleared."}


def dismiss_reminder_service(reminder_id):
    """
    Dismisses/mutes a specific reminder (e.g. an Out-of-Stock product alert)
    so it is not broadcast again.
    """
    global _cleared_ids
    if reminder_id:
        s_id = str(reminder_id).strip()
        _cleared_ids.add(s_id)
        clean = s_id.replace("stock_", "").replace("order_", "")
        _cleared_ids.add(clean)
        _cleared_ids.add(f"stock_{clean}")
    broadcast_reminders_data()
    return {"status": "SUCCESS", "message": f"Reminder {reminder_id} dismissed."}


def reset_reminders_service():
    """
    Resets cleared status so operational reminders recalculate directly from live database.
    """
    global _cleared_all, _cleared_ids
    _cleared_all = False
    _cleared_ids.clear()
    broadcast_reminders_data()
    return {"status": "SUCCESS", "message": "Reminders refreshed from database."}


def broadcast_reminders_data():
    """
    Broadcasts the latest reminders payload to all connected WebSockets in 'reminders_group'.
    """
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            data = get_all_reminders_service()
            async_to_sync(channel_layer.group_send)(
                "reminders_group",
                {
                    "type": "send_reminders_data",
                    "data": data,
                }
            )
    except Exception as e:
        logger.warning(f"Could not broadcast reminders: {e}")


def get_all_reminders_service():
    """
    Core business logic that calculates real-time operational reminders directly from database:
    1. Active order packing & SLA dispatch alerts (Express, Scheduled, Pickup) from PostgreSQL
    2. Real out-of-stock product refill alerts from inventory
    """
    if _cleared_all:
        return []

    now = get_ist_now()
    today_date = get_ist_today()
    reminders = []
    assignments_map = {}

    try:
        assignments = OrderAssignments.objects.select_related('delivery_boy').all()
        for oa in assignments:
            assignments_map[oa.order_id] = oa
    except Exception as e:
        logger.warning(f"Could not load order assignments in reminder service: {e}")

    # =========================================================================
    # A. ORDER PACKING & DISPATCH SLA REMINDERS (100% Real Database Orders)
    # =========================================================================
    try:
        active_orders = (
            Order.objects
            .select_related('address', 'user', 'user__user', 'delivery_slot')
            .prefetch_related('items__product')
            .exclude(status__in=['Delivered', 'delivered', 'done', 'Cancelled', 'cancelled', 'rejected'])
            .order_by('-id')
        )

        for order in active_orders:
            mode = str(order.delivery_mode or "").lower()
            status = str(order.status or "").lower().strip()

            is_pickup = "pickup" in mode or "shop" in mode
            is_scheduled = "schedul" in mode
            is_express = not is_pickup and not is_scheduled

            # Customer name & details
            cust_name = "Customer"
            cust_phone = ""
            cust_address = "Delivery Area"
            if order.address:
                cust_name = getattr(order.address, 'name', cust_name) or cust_name
                cust_phone = getattr(order.address, 'mobile', '') or ""
                addr_parts = [
                    str(p).strip()
                    for p in [
                        getattr(order.address, 'address_line1', None),
                        getattr(order.address, 'address_line2', None),
                        getattr(order.address, 'landmark', None)
                    ]
                    if p and str(p).strip()
                ]
                cust_address = ", ".join(addr_parts) if addr_parts else (getattr(order.address, 'city', "Delivery Area") or "Delivery Area")
            elif order.user:
                cust_name = getattr(order.user, 'name', cust_name) or cust_name
                if hasattr(order.user, 'user') and order.user.user:
                    cust_phone = getattr(order.user.user, 'mobile', '') or ""

            # Basket summary
            basket_items = []
            basket_names = []
            total_amount = float(order.total_amount) if order.total_amount else 0.0
            for item in order.items.all():
                p_name = item.product.name if item.product else "Item"
                basket_names.append(p_name)
                basket_items.append({
                    "id": item.id,
                    "name": p_name,
                    "weight": item.weight or "",
                    "quantity": item.quantity,
                    "price": float(item.total_price) if item.total_price else (float(item.unit_price) * item.quantity if item.unit_price else 0.0),
                })

            items_preview = ", ".join(basket_names[:3])
            if len(basket_names) > 3:
                items_preview += f", +{len(basket_names) - 3} more"

            basket_summary = f"{len(basket_items)} Items ({items_preview})" if basket_items else "Fresh Produce Basket"
            order_num = order.order_number or f"SMV-{order.id}"
            order_dt = to_ist(order.created_at) if order.created_at else now

            # -------------------------------------------------------------
            # 1. INSTANT EXPRESS (25-MIN SLA) REMINDERS
            # -------------------------------------------------------------
            if is_express:
                # Exclude orders already Out for Delivery or completed
                if status in ['out_for_delivery', 'out for delivery', 'ofd']:
                    continue

                if order.updated_at and order.updated_at > order.created_at:
                    start_dt = to_ist(order.updated_at)
                else:
                    start_dt = order_dt

                start_dt = to_ist(start_dt)
                now_ist = to_ist(now)

                elapsed_seconds = max(0, (now_ist - start_dt).total_seconds())
                elapsed_mins = int(elapsed_seconds // 60)
                if order_dt.date() < today_date:
                    elapsed_mins = max(elapsed_mins, 25)

                has_oa = order.id in assignments_map and assignments_map[order.id].delivery_boy
                rider_name = assignments_map[order.id].delivery_boy.name if has_oa else "Rider"
                rider_phone = getattr(assignments_map[order.id].delivery_boy, 'mobile', '') if has_oa else "+91 98401 23456"
                rider_vehicle = getattr(assignments_map[order.id].delivery_boy, 'vehicle_number', 'TN-01-AB-1234') if has_oa else "TN-01-AB-1234"

                is_packing_phase = status in ['new order', 'new_order', 'pending', 'confirmed', 'packing', 'confirmed & packing', 'confirm_and_packing', 'waiting']
                is_packed_phase = status in ['ready for dispatch', 'ready_for_dispatch', 'ready for pick up', 'packed', 'dispatch']

                # Trigger 1: Packing Lag Reminder (> 7 mins in Packing)
                is_packing_lag = is_packing_phase and elapsed_mins >= 7

                # Trigger 2A: Assign Rider Urgency (> 10-12 mins packed without rider)
                is_rider_unassigned = is_packed_phase and not has_oa and elapsed_mins >= 10

                # Trigger 2B: Rider Assigned but Not Picked Up (> 7-8 mins waiting at counter)
                is_rider_pickup_lag = is_packed_phase and has_oa and elapsed_mins >= 7

                if is_packing_lag or is_rider_unassigned or is_rider_pickup_lag:
                    subtype = "packing_lag"
                    badge_text = "SLA Alert"
                    title = f"Pack Express {order_num} ({cust_name})"
                    warning_text = f"Packing Lag: {elapsed_mins} mins elapsed (Target: 7m)"
                    store_action = "Move to Dispatch & Hand to Rider"

                    if is_rider_unassigned:
                        subtype = "rider_lag"
                        badge_text = "SLA Alert"
                        title = f"Dispatch Express {order_num} ({cust_name})"
                        warning_text = f"Assign Rider Urgency: {elapsed_mins} mins elapsed (Target: 10-12m)"
                        store_action = "Assign / Reassign Nearest Rider & Dispatch"
                    elif is_rider_pickup_lag:
                        subtype = "rider_pickup_lag"
                        badge_text = "PICKUP LAG"
                        title = f"Rider Not Picked Up: {order_num} ({rider_name})"
                        warning_text = f"⚠️ Bag sitting at counter for {elapsed_mins} mins!"
                        store_action = f"Call Rider ({rider_name}) or Reassign to Available Rider"

                    reminders.append({
                        "id": f"order_{order.id}",
                        "orderId": order.id,
                        "orderNum": order_num,
                        "customerName": cust_name,
                        "customerAddress": cust_address,
                        "customerPhone": cust_phone,
                        "riderName": rider_name,
                        "riderPhone": rider_phone,
                        "riderVehicle": rider_vehicle,
                        "basketSummary": basket_summary,
                        "storeAction": store_action,
                        "warningText": warning_text,
                        "type": "express",
                        "subtype": subtype,
                        "title": title,
                        "description": f"{order_num} is an Instant Express 25-min delivery. {warning_text}. {store_action}",
                        "badgeText": badge_text,
                        "timingLabel": warning_text,
                        "isDue": True,
                        "diffMinutes": max(0, 25 - elapsed_mins),
                        "elapsedMins": elapsed_mins,
                        "isPackingLag": is_packing_lag,
                        "isRiderUnassigned": is_rider_unassigned,
                        "isRiderPickupLag": is_rider_pickup_lag,
                        "order": {
                            "id": order.id,
                            "order_id": order_num,
                            "order_number": order.order_number or order_num,
                            "customer": {"name": cust_name, "phone": cust_phone, "address": cust_address},
                            "status": order.status,
                            "delivery_mode": "express",
                            "amount": total_amount,
                            "items_count": len(basket_items),
                            "items_preview": items_preview,
                            "basket": basket_items,
                        }
                    })

            # -------------------------------------------------------------
            # 2. SHOP PICKUP & SCHEDULED DELIVERY PACKING PREP REMINDERS
            # -------------------------------------------------------------
            elif is_pickup or is_scheduled:
                is_awaiting_pack = status in ['new order', 'new_order', 'pending', '', 'unconfirmed', 'confirmed', 'packing', 'confirmed & packing', 'confirm_and_packing', 'waiting']
                if not is_awaiting_pack:
                    continue

                slot_str = ""
                ocdt = getattr(order, 'order_config_day_timings', None)
                if ocdt and getattr(ocdt, 'timing', None) and getattr(ocdt.timing, 'start_time', None):
                    t = ocdt.timing
                    s_t = format_12h_time(t.start_time)
                    e_t = format_12h_time(t.end_time)
                    slot_str = f"{t.slot_label} ({s_t} - {e_t})" if t.slot_label else f"{s_t} - {e_t}"
                elif order.delivery_slot:
                    slot_str = getattr(order.delivery_slot, 'slot_title', None) or getattr(order.delivery_slot, 'slot_name', None) or ""
                    if not slot_str and hasattr(order.delivery_slot, 'start_time') and order.delivery_slot.start_time:
                        slot_str = order.delivery_slot.start_time.strftime("%I:%M %p")

                # Resolve target scheduled / pickup delivery date
                target_date = getattr(order, 'delivery_date', None) or getattr(order, 'order_date', None) or order_dt.date()
                if hasattr(target_date, 'date'):
                    target_date = target_date.date()

                # Ignore orders scheduled far in the future (> 1 day ahead)
                if target_date > today_date + timedelta(days=1):
                    continue

                is_today = (target_date == today_date)
                is_past = (target_date < today_date)
                day_label = "Today" if is_today else ("Overdue" if is_past else "Tomorrow")

                if not slot_str:
                    # STRICTLY use configured OrderConfigDayTimings / DeliveryTimings slots
                    h = order_dt.hour
                    if h < 8:
                        slot_hour, slot_minute, slot_label = 8, 0, "Morning • Popular (08:00 AM - 10:00 AM)"
                    elif h < 12:
                        slot_hour, slot_minute, slot_label = 10, 0, "Late Morning (10:00 AM - 12:00 PM)"
                    elif h < 18:
                        slot_hour, slot_minute, slot_label = 16, 0, "Evening (04:00 PM - 06:00 PM)"
                    else:
                        slot_hour, slot_minute, slot_label = 18, 0, "Night (06:00 PM - 08:00 PM)"
                    slot_start = to_ist(now).replace(year=target_date.year, month=target_date.month, day=target_date.day, hour=slot_hour, minute=slot_minute, second=0, microsecond=0)
                else:
                    slot_hour, slot_minute, slot_label = extract_slot_hour_minute(slot_str)
                    try:
                        slot_start = to_ist(now).replace(year=target_date.year, month=target_date.month, day=target_date.day, hour=slot_hour, minute=slot_minute, second=0, microsecond=0)
                    except Exception:
                        slot_start = to_ist(now).replace(hour=slot_hour, minute=slot_minute, second=0, microsecond=0)

                now_ist = to_ist(now)
                pack_start = slot_start - timedelta(minutes=45)
                is_due = is_past or (now_ist >= pack_start)

                diff_mins = int((slot_start - now_ist).total_seconds() // 60)
                pack_diff_mins = int((pack_start - now_ist).total_seconds() // 60)

                if is_due:
                    badge_text = "Overdue" if is_past else "Due Now"
                    if is_past:
                        timing_label = f"Overdue! Scheduled for {target_date.strftime('%d %b')}. Pack immediately!"
                    elif diff_mins > 0:
                        timing_label = f"Pack for pickup! Customer arrives in {diff_mins}m ({day_label} {slot_label})" if is_pickup else f"Pack now! Delivery slot starts in {diff_mins}m ({day_label} {slot_label})"
                    else:
                        timing_label = f"Customer pickup slot active! Pack immediately ({day_label} {slot_label})" if is_pickup else f"Slot is active! Pack immediately ({day_label} {slot_label})"
                else:
                    badge_text = day_label
                    timing_label = f"Pack starts at {pack_start.strftime('%I:%M %p')} (in {pack_diff_mins}m)"

                rem_type = "pickup" if is_pickup else "scheduled"
                title = f"Pack Shop Pickup: {order_num} ({cust_name})" if is_pickup else f"Pack Scheduled: {order_num} ({cust_name})"

                reminders.append({
                    "id": f"order_{order.id}",
                    "orderId": order.id,
                    "orderNum": order_num,
                    "customerName": cust_name,
                    "customerAddress": cust_address,
                    "customerPhone": cust_phone,
                    "basketSummary": basket_summary,
                    "type": rem_type,
                    "title": title,
                    "description": f"Prepare order {order_num} for {cust_name} ({day_label} {slot_label}).",
                    "badgeText": badge_text,
                    "timingLabel": timing_label,
                    "isDue": is_due,
                    "diffMinutes": diff_mins,
                    "packDiffMins": pack_diff_mins,
                    "slotTimeLabel": slot_label,
                    "dayLabel": day_label,
                    "isToday": is_today,
                    "order": {
                        "id": order.id,
                        "order_id": order_num,
                        "order_number": order.order_number or order_num,
                        "customer": {"name": cust_name, "phone": cust_phone, "address": cust_address},
                        "status": order.status,
                        "delivery_mode": mode,
                        "amount": total_amount,
                        "items_count": len(basket_items),
                        "items_preview": items_preview,
                        "basket": basket_items,
                    }
                })

    except Exception as e:
        logger.error(f"Error evaluating order reminders: {e}", exc_info=True)

    # =========================================================================
    # B. OUT-OF-STOCK PRODUCT REFILL REMINDERS (100% Real Database Products)
    # =========================================================================
    try:
        products = (
            Product.objects
            .select_related('category', 'subcategory')
            .prefetch_related('variants')
            .filter(is_active=True)
            .order_by('name')
        )

        for prod in products:
            if not prod.is_active:
                continue

            variants = list(prod.variants.all())
            if not variants:
                continue

            # Calculate total available stock across all variants
            total_stock = sum(v.stock_quantity for v in variants if v.stock_quantity is not None)
            all_unavailable = all(
                (v.stock_quantity is None or v.stock_quantity <= 0 or not v.is_available)
                for v in variants
            )

            # Product is considered Out of Stock ONLY IF total stock is 0 or all variants are unavailable
            is_oos = (total_stock <= 0) or all_unavailable

            if is_oos:
                oos_variants = [
                    v.unit_value or (f"{v.weight_in_grams}g" if v.weight_in_grams else "Standard")
                    for v in variants
                    if (v.stock_quantity or 0) <= 0 or not v.is_available
                ]
                variant_labels_str = ", ".join(oos_variants) if oos_variants else "All variants (0 in stock)"
                cat_name = prod.category.name if prod.category else "Vegetables"
                subcat_name = prod.subcategory.name if prod.subcategory else "Fresh"

                reminders.append({
                    "id": f"stock_{prod.id}",
                    "productId": prod.id,
                    "productName": prod.name,
                    "type": "stock",
                    "title": f"Refill Stock: {prod.name}",
                    "description": f"{prod.name} ({variant_labels_str}) is Out of Stock. Refill inventory immediately!",
                    "badgeText": "Out of Stock",
                    "timingLabel": "Stock: 0 in Stock • Refill immediately",
                    "isDue": True,
                    "diffMinutes": 0,
                    "product": {
                        "id": prod.id,
                        "name": prod.name,
                        "tamil_name": prod.tamil_name or "",
                        "category_name": cat_name,
                        "subcategory_name": subcat_name,
                        "status": "Out of Stock",
                    },
                    "oosVariantLabels": variant_labels_str,
                })

    except Exception as e:
        logger.error(f"Error evaluating product reminders: {e}", exc_info=True)

    # Return reminders, excluding those marked done in this session
    return [r for r in reminders if r.get('id') not in _cleared_ids]
