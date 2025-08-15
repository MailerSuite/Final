import random

from core.constants import USER_AGENTS_LIST


def get_random_ua() -> str:
    """Return a random User-Agent string from predefined list."""
    ua = random.choice(USER_AGENTS_LIST)
    if ua.startswith("youorg-"):
        ua = ua.split("youorg-", 1)[1]
    return ua
