"""
biz/utils/time_utils.py

Timezone & 12-Hour AM/PM Helper Utilities
- அனைத்து நேரங்களையும் Asia/Kolkata (IST) நேரமாக மாற்றும்.
- Database UTC நேரங்களை பாதுகாப்பாக 12-hour AM/PM வடிவில் Format செய்யும்.
"""

from datetime import datetime, date, time
from zoneinfo import ZoneInfo
from django.utils import timezone

# இந்திய நேர மண்டலம் (Asia/Kolkata)
IST_TZ = ZoneInfo("Asia/Kolkata")


def get_ist_now() -> datetime:
    """
    தற்போதைய இந்திய நேரத்தை (IST) DateTime object-ஆக தரும்.
    பயன்பாடு: Order உருவாக்கப்படும் நேரம், Cutoff நேரம் சரிபார்க்க.
    """
    return timezone.now().astimezone(IST_TZ)


def get_ist_today() -> date:
    """
    இன்றைய இந்திய தேதியை (Date object) தரும்.
    பயன்பாடு: Today / Tomorrow delivery slots கணக்கிட.
    """
    return get_ist_now().date()


def get_ist_time() -> time:
    """
    தற்போதைய இந்திய நேரத்தை மட்டும் (Time object) தரும்.
    பயன்பாடு: நேர ஸ்லாட் முடிந்துவிட்டதா (Expiry check) என பார்க்க.
    """
    return get_ist_now().time()


def to_ist(dt: datetime) -> datetime:
    """
    எந்த ஒரு DateTime-ஆக இருந்தாலும் (DB-ல் இருந்து வரும் UTC உட்பட),
    அதை பாதுகாப்பாக Asia/Kolkata (IST) நேரமாக மாற்றும்.
    """
    if dt is None:
        return None

    # ஒருவேளை Timezone இல்லாத (Naive) நேரமாக இருந்தால், முதலில் UTC ஆக்கி பின் IST-க்கு மாற்றும்
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, timezone.utc)

    return dt.astimezone(IST_TZ)


def format_12h_datetime(dt: datetime, fmt: str = "%d %b %Y, %I:%M %p") -> str:
    """
    DateTime-ஐ 12-Hour AM/PM வடிவில் String-ஆக மாற்றும்.
    உதாரணம்: "20 Nov 2026, 02:30 PM"
    """
    if not dt:
        return ""
    ist_dt = to_ist(dt)
    return ist_dt.strftime(fmt)


def format_12h_time(dt_or_time) -> str:
    """
    நேரத்தை மட்டும் 12-Hour AM/PM வடிவில் தரும்.
    உதாரணம்: "06:00 AM", "09:30 PM"
    """
    if not dt_or_time:
        return ""
    if isinstance(dt_or_time, datetime):
        return to_ist(dt_or_time).strftime("%I:%M %p")
    elif isinstance(dt_or_time, time):
        return dt_or_time.strftime("%I:%M %p")
    return str(dt_or_time)


def parse_12h_time(time_str: str) -> time:
    """
    Frontend அல்லது DB-ல் இருந்து வரும் "06:00 AM" போன்ற 
    String-ஐ Python time object ஆக மாற்றும்.
    """
    if not time_str:
        return None
    try:
        return datetime.strptime(time_str.strip(), "%I:%M %p").time()
    except Exception:
        return None


def format_model_timestamps(instance) -> dict:
    """
    எந்த ஒரு Model-ன் (Order, Address, Profile) created_at மற்றும் 
    updated_at-ஐயும் 12-hour AM/PM IST-ல் அகராதியாக (Dict) தரும்.

    Output:
    {
        "created_at": "20 Nov 2026, 02:30 PM",
        "updated_at": "20 Nov 2026, 02:30 PM"
    }
    """
    if not instance:
        return {"created_at": None, "updated_at": None}

    c_at = getattr(instance, 'created_at', None)
    u_at = getattr(instance, 'updated_at', None)

    return {
        "created_at": format_12h_datetime(c_at),
        "updated_at": format_12h_datetime(u_at)
    }
