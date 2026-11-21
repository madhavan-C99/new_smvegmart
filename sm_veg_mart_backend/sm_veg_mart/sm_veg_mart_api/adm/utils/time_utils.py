"""
Timezone & 12-Hour AM/PM Helper Utilities
Standard: Asia/Kolkata (IST) & 12-Hour AM/PM Formats
"""

import re
from datetime import datetime, date, time, timezone as dt_timezone
from zoneinfo import ZoneInfo
from django.utils import timezone

IST_TZ = ZoneInfo("Asia/Kolkata")


def get_ist_now() -> datetime:
    """Returns current aware datetime in Asia/Kolkata (IST)."""
    return timezone.now().astimezone(IST_TZ)


def get_ist_today() -> date:
    """Returns today's date in Asia/Kolkata (IST)."""
    return get_ist_now().date()


def get_ist_time() -> time:
    """Returns current time in Asia/Kolkata (IST)."""
    return get_ist_now().time()


def to_ist(dt: datetime) -> datetime:
    """Converts any datetime (naive or UTC from DB) safely to IST."""
    if dt is None:
        return None
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, dt_timezone.utc)
    return dt.astimezone(IST_TZ)


def format_12h_datetime(dt: datetime, fmt: str = "%d %b %Y, %I:%M %p") -> str:
    """Formats datetime to 12-Hour AM/PM IST. Example: '20 Nov 2026, 02:30 PM'"""
    if not dt:
        return ""
    ist_dt = to_ist(dt)
    return ist_dt.strftime(fmt)


def format_12h_time(dt_or_time) -> str:
    """Formats time or datetime to 12-Hour AM/PM. Example: '06:00 AM'"""
    if not dt_or_time:
        return ""
    if isinstance(dt_or_time, datetime):
        return to_ist(dt_or_time).strftime("%I:%M %p")
    elif isinstance(dt_or_time, time):
        return dt_or_time.strftime("%I:%M %p")
    return str(dt_or_time)


def parse_12h_time(time_str: str) -> time:
    """Parses '06:00 AM' string into a python datetime.time object."""
    if not time_str:
        return None
    clean = str(time_str).strip()
    try:
        return datetime.strptime(clean, "%I:%M %p").time()
    except Exception:
        # Also try matching standard pattern with flexible spacing
        match = re.search(r'(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)', clean, re.I)
        if match:
            hour = int(match.group(1))
            minute = int(match.group(2))
            meridiem = match.group(3).upper()
            if meridiem == 'PM' and hour < 12:
                hour += 12
            elif meridiem == 'AM' and hour == 12:
                hour = 0
            return time(hour, minute)
        return None


def format_model_timestamps(instance) -> dict:
    """
    Returns {'created_at': '...', 'updated_at': '...'} 
    in 12-hour AM/PM IST for any Django model.
    """
    if not instance:
        return {"created_at": None, "updated_at": None}

    c_at = getattr(instance, 'created_at', None)
    u_at = getattr(instance, 'updated_at', None)

    return {
        "created_at": format_12h_datetime(c_at),
        "updated_at": format_12h_datetime(u_at)
    }
