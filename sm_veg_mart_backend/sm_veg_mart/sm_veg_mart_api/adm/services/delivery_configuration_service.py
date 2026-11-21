import logging
from decimal import Decimal
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework.exceptions import ValidationError

from adm.models.order_configuration import OrderConfiguration
from adm.models.delivery_days import DeliveryDays
from adm.models.delivery_timings import DeliveryTimings
from adm.models.order_config_day_timings import OrderConfigDayTimings
from adm.utils.time_utils import format_12h_time, parse_12h_time


logger = logging.getLogger('django')


METADATA_MAP = {
    "express": {
        "title": "Instant Delivery",
        "badge": "15-30 Min",
        "description": "Allow customers to place orders for immediate priority packaging and dispatch."
    },
    "scheduled": {
        "title": "Scheduled Delivery",
        "badge": None,
        "description": "Allow customers to choose specific upcoming delivery dates and scheduled time windows."
    },
    "pickup": {
        "title": "Shop Pickup",
        "badge": None,
        "description": "Allow customers to shop and order products online for convenient pickup at our store."
    }
}


def broadcast_delivery_configuration():
    """
    Broadcasts the latest delivery configuration data to all connected WebSockets
    in 'delivery_options_group'.
    """
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            data = get_full_delivery_configuration_service()
            async_to_sync(channel_layer.group_send)(
                "delivery_options_group",
                {
                    "type": "send_delivery_configuration_data",
                    "data": data,
                }
            )
    except Exception as e:
        logger.warning(f"Could not broadcast delivery configuration: {e}")


def get_full_delivery_configuration_service():
    """
    Fetches the full delivery options, available days, delivery timings,
    and day-timing slot mappings for Scheduled Delivery and Shop Pickup.
    """
    # 1. Fetch Order Configurations (express, scheduled, pickup)
    configs = list(OrderConfiguration.objects.all().order_by('id'))
    config_dict = {cfg.delivery_option: cfg for cfg in configs}

    order_configurations_list = []
    for cfg in configs:
        meta = METADATA_MAP.get(cfg.delivery_option, {
            "title": cfg.delivery_option.capitalize(),
            "badge": None,
            "description": ""
        })
        order_configurations_list.append({
            "id": cfg.id,
            "delivery_option": cfg.delivery_option,
            "title": meta["title"],
            "badge": meta["badge"],
            "description": meta["description"],
            "is_enabled": cfg.is_enabled,
            "delivery_charge": float(cfg.delivery_charge),
            "min_amount": float(cfg.min_amount),
        })

    # 2. Fetch Days (Monday to Sunday)
    days = list(DeliveryDays.objects.all().order_by('day_code'))
    days_list = [
        {
            "id": d.id,
            "day_name": d.day_name,
            "day_code": d.day_code,
            "is_available": d.is_available,
        }
        for d in days
    ]

    # 3. Fetch Master Timings
    timings = list(DeliveryTimings.objects.all().order_by('id'))
    timings_list = [
        {
            "id": t.id,
            "start_time": format_12h_time(t.start_time),
            "end_time": format_12h_time(t.end_time),
            "slot_label": t.slot_label,
            "is_active": t.is_active,

        }
        for t in timings
    ]

    # 4. Helper to build configuration slots for a specific delivery option
    def build_option_structure(option_key):
        cfg = config_dict.get(option_key)
        if not cfg:
            return {"is_enabled": False, "days": []}

        # Fetch all day-timing records for this order_config
        day_timings_qs = (
            OrderConfigDayTimings.objects
            .filter(order_config=cfg)
            .select_related('day', 'timing')
            .order_by('day__day_code', 'timing__id')
        )

        # Ensure all combinations exist; if not, create on the fly
        existing_combos = {(dt.day_id, dt.timing_id): dt for dt in day_timings_qs}
        to_create = []
        for d in days:
            for t in timings:
                if (d.id, t.id) not in existing_combos:
                    to_create.append(OrderConfigDayTimings(
                        order_config=cfg,
                        day=d,
                        timing=t,
                        is_active=t.is_active,
                        created_by='system',
                        updated_by='system'
                    ))
        if to_create:
            OrderConfigDayTimings.objects.bulk_create(to_create)
            day_timings_qs = (
                OrderConfigDayTimings.objects
                .filter(order_config=cfg)
                .select_related('day', 'timing')
                .order_by('day__day_code', 'timing__id')
            )

        # Group by day
        grouped = {}
        for dt in day_timings_qs:
            grouped.setdefault(dt.day_id, []).append({
                "mapping_id": dt.id,
                "timing_id": dt.timing.id,
                "start_time": format_12h_time(dt.timing.start_time),
                "end_time": format_12h_time(dt.timing.end_time),
                "slot_label": dt.timing.slot_label,
                "is_active": dt.is_active,
                "status": "Active" if dt.is_active else "Disabled",

            })

        days_result = []
        for d in days:
            slots = grouped.get(d.id, [])
            active_slots = [s for s in slots if s["is_active"]]
            # Day is available if d.is_available is True and it has at least one active slot
            # Or directly following d.is_available
            is_day_available = d.is_available and len(active_slots) > 0
            days_result.append({
                "day_id": d.id,
                "day_name": d.day_name,
                "day_code": d.day_code,
                "is_available": is_day_available,
                "status_label": "Available" if is_day_available else "Disabled",
                "slots_count": len(slots),
                "active_slots_count": len(active_slots),
                "slots": slots,
            })

        return {
            "id": cfg.id,
            "delivery_option": cfg.delivery_option,
            "is_enabled": cfg.is_enabled,
            "delivery_charge": float(cfg.delivery_charge),
            "min_amount": float(cfg.min_amount),
            "days": days_result,
        }

    scheduled_data = build_option_structure("scheduled")
    pickup_data = build_option_structure("pickup")
    express_cfg = config_dict.get("express")

    return {
        "status": "SUCCESS",
        "order_configurations": order_configurations_list,
        "express": {
            "id": express_cfg.id if express_cfg else None,
            "delivery_option": "express",
            "is_enabled": express_cfg.is_enabled if express_cfg else True,
            "delivery_charge": float(express_cfg.delivery_charge) if express_cfg else 25.0,
            "min_amount": float(express_cfg.min_amount) if express_cfg else 299.0,
        },
        "scheduled": scheduled_data,
        "pickup": pickup_data,
        "days": days_list,
        "timings": timings_list,
        "timestamp": timezone.now().isoformat(),
    }


def toggle_delivery_option_service(delivery_option, is_enabled=None):
    """
    Toggles the is_enabled flag for an OrderConfiguration ('express', 'scheduled', 'pickup').
    """
    try:
        cfg = OrderConfiguration.objects.get(delivery_option=delivery_option)
    except OrderConfiguration.DoesNotExist:
        raise ValidationError({"message": f"Order configuration '{delivery_option}' does not exist."})

    if is_enabled is not None:
        cfg.is_enabled = bool(is_enabled)
    else:
        cfg.is_enabled = not cfg.is_enabled

    cfg.save(update_fields=['is_enabled', 'updated_at'])
    broadcast_delivery_configuration()

    return {
        "delivery_option": cfg.delivery_option,
        "is_enabled": cfg.is_enabled,
        "message": f"{cfg.delivery_option} delivery is now {'enabled' if cfg.is_enabled else 'disabled'}."
    }


def toggle_delivery_day_service(delivery_option, day_id, is_available=None):
    """
    Toggles availability of a day for a given delivery option (scheduled or pickup).
    Turning OFF disables all slot timings for that day.
    Turning ON enables slot timings for that day.
    """
    try:
        cfg = OrderConfiguration.objects.get(delivery_option=delivery_option)
    except OrderConfiguration.DoesNotExist:
        raise ValidationError({"message": f"Order configuration '{delivery_option}' not found."})

    try:
        day = DeliveryDays.objects.get(id=day_id)
    except DeliveryDays.DoesNotExist:
        raise ValidationError({"message": f"Day with id {day_id} not found."})

    # Determine desired target status
    day_slots = OrderConfigDayTimings.objects.filter(order_config=cfg, day=day)
    has_active_slots = day_slots.filter(is_active=True).exists()

    if is_available is not None:
        target_state = bool(is_available)
    else:
        target_state = not has_active_slots

    # Update all slots for this day & configuration
    day_slots.update(is_active=target_state, updated_at=timezone.now())

    # If all options agree or for global consistency, update day.is_available
    # If target_state is True, ensure day.is_available is True
    if target_state and not day.is_available:
        day.is_available = True
        day.save(update_fields=['is_available', 'updated_at'])

    broadcast_delivery_configuration()

    return {
        "delivery_option": delivery_option,
        "day_id": day.id,
        "day_name": day.day_name,
        "is_available": target_state,
        "message": f"{day.day_name} is now {'Available' if target_state else 'Disabled'} for {delivery_option}."
    }


def toggle_day_timing_slot_service(mapping_id, is_active=None):
    """
    Toggles the active state of an individual time slot (OrderConfigDayTimings).
    """
    try:
        dt = OrderConfigDayTimings.objects.select_related('order_config', 'day', 'timing').get(id=mapping_id)
    except OrderConfigDayTimings.DoesNotExist:
        raise ValidationError({"message": f"Slot mapping with id {mapping_id} not found."})

    if is_active is not None:
        dt.is_active = bool(is_active)
    else:
        dt.is_active = not dt.is_active

    dt.save(update_fields=['is_active', 'updated_at'])

    # If slot became active and parent day was disabled, ensure day.is_available is True
    if dt.is_active and not dt.day.is_available:
        dt.day.is_available = True
        dt.day.save(update_fields=['is_available', 'updated_at'])

    broadcast_delivery_configuration()

    return {
        "mapping_id": dt.id,
        "delivery_option": dt.order_config.delivery_option,
        "day_name": dt.day.day_name,
        "slot_label": dt.timing.slot_label,
        "is_active": dt.is_active,
        "status": "Active" if dt.is_active else "Disabled",
        "message": f"{dt.timing.slot_label} slot is now {'Active' if dt.is_active else 'Disabled'}."
    }
