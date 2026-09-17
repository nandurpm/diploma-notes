"""Delivery windows for queued daily FCM jobs, evaluated in Asia/Kolkata."""
from datetime import datetime, time

SCHEDULE_MODES = {"30 1 * * *": "Good Morning", "30 3 * * *": "Special Day"}
WINDOWS = {"Good Morning": (5, 12), "Special Day": (8, 18)}


def resolve_mode(mode: str, schedule: str, now: datetime):
    """Return (mode, remaining TTL); never queue a greeting beyond its window."""
    if mode == "Auto":
        mode = SCHEDULE_MODES.get(schedule)
        if mode is None:
            mode = "Good Morning" if now.hour < 12 else "Special Day"
    if mode not in WINDOWS:
        raise ValueError(f"Unknown notification mode: {mode}")
    start, end = WINDOWS[mode]
    if not start <= now.hour < end:
        return mode, 0
    cutoff = datetime.combine(now.date(), time(end), tzinfo=now.tzinfo)
    return mode, max(0, int((cutoff - now).total_seconds()))
