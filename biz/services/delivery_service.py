import logging
from datetime import timedelta

from adm.models.order_configuration import OrderConfiguration
from adm.models.delivery_days import DeliveryDays
from adm.models.delivery_timings import DeliveryTimings
from adm.models.order_config_day_timings import OrderConfigDayTimings
from biz.utils.time_utils import get_ist_today, get_ist_time, parse_12h_time

logger = logging.getLogger(__name__)


# 1. குறிப்பிட்ட நாள் (Today/Tomorrow) & Option (Pickup/Scheduled)-க்குரிய Active நேர ஸ்லாட்டுகளை எடுத்தல்
def _get_slots_for_date(order_config, target_date, is_today=False):
    if not order_config:
        return []

    day_name = target_date.strftime("%A")

    # அந்த நாள் DeliveryDays-ல் Available-ஆ எனப் பார்த்தல் (எ.கா: ஞாயிறு False என்றால் காலியாக அனுப்பும்)
    day_obj = DeliveryDays.objects.filter(day_name=day_name).first()
    if day_obj and not day_obj.is_available:
        return []

    # Mapping டேபிளிலிருந்து இந்த Option மற்றும் இந்த கிழமைக்குரிய Active நேரங்களை எடுத்தல்
    mappings = OrderConfigDayTimings.objects.filter(
        order_config=order_config,
        day__day_name=day_name,
        is_active=True,
        timing__is_active=True
    ).select_related('timing').order_by('timing__id')

    current_time = get_ist_time()
    formatted_times = []

    for m in mappings:
        t = m.timing
        time_label = f"{t.start_time} - {t.end_time}"

        # இன்றைய நாளாக இருந்தால், முடிந்துபோன நேரங்களை Skip செய்கிறோம்
        if is_today:
            end_t = parse_12h_time(t.end_time)
            if end_t and current_time >= end_t:
                continue

        # Frontend Order போடும் போது இந்த order_day_config_timings_id-யை Backend-க்கு அனுப்பும்
        formatted_times.append({
            "order_day_config_timings_id": m.id,
            "time": time_label
        })

    return formatted_times


# 2. Today மற்றும் Tomorrow-க்கான ஸ்லாட்டுகளைத் தயாரித்தல்
def _build_slots_for_config(order_config):
    today_date = get_ist_today()
    tomorrow_date = today_date + timedelta(days=1)

    today_times = _get_slots_for_date(order_config, today_date, is_today=True)
    tomorrow_times = _get_slots_for_date(order_config, tomorrow_date, is_today=False)

    return [
        {
            "date": today_date.strftime("%Y-%m-%d"),
            "day_label": "Today",
            "date_label": today_date.strftime("%d %b"),
            "times": today_times,
        },
        {
            "date": tomorrow_date.strftime("%Y-%m-%d"),
            "day_label": "Tomorrow",
            "date_label": tomorrow_date.strftime("%d %b"),
            "times": tomorrow_times,
        },
    ]


# 4. Main Service: Admin Configurations மற்றும் Slots-ஐ ஒன்று திரட்டி இறுதி Response தயாரித்தல்
def get_delivery_options_service():
    logger.info("get_delivery_options_service_call")

    # Admin Master Settings-லிருந்து Express, Scheduled, Pickup விபரங்களை எடுத்தல்
    configs = {c.delivery_option: c for c in OrderConfiguration.objects.all()}

    express_cfg = configs.get("express")
    scheduled_cfg = configs.get("scheduled")
    pickup_cfg = configs.get("pickup")

    express_data = {
        "order_config_id": express_cfg.id if express_cfg else None,
        "is_enabled": express_cfg.is_enabled if express_cfg else True,
        "delivery_fee": int(express_cfg.delivery_charge) if express_cfg else 25,
        "free_delivery_above": int(express_cfg.min_amount) if express_cfg else 299,
    }

    pickup_data = {
        "order_config_id": pickup_cfg.id if pickup_cfg else None,
        "is_enabled": pickup_cfg.is_enabled if pickup_cfg else True,
        "delivery_fee": int(pickup_cfg.delivery_charge) if pickup_cfg else 0,
        "free_delivery_above": int(pickup_cfg.min_amount) if pickup_cfg else 0,
        "slots": _build_slots_for_config(pickup_cfg),
    }

    scheduled_data = {
        "order_config_id": scheduled_cfg.id if scheduled_cfg else None,
        "is_enabled": scheduled_cfg.is_enabled if scheduled_cfg else True,
        "delivery_fee": int(scheduled_cfg.delivery_charge) if scheduled_cfg else 10,
        "free_delivery_above": int(scheduled_cfg.min_amount) if scheduled_cfg else 299,
        "slots": _build_slots_for_config(scheduled_cfg),
    }

    return {
        "express": express_data,
        "pickup": pickup_data,
        "scheduled": scheduled_data,
    }
