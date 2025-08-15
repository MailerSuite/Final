import socket
from urllib.parse import urlparse

import aiohttp

# Delay logger import to avoid circular dependencies
logger = None


def _get_logger():
    global logger
    if logger is None:
        from core.logger import get_logger

        logger = get_logger(__name__)
    return logger


async def lookup_country(host: str, timeout: int = 5) -> str | None:
    """Return the country name for a host or IP using ip-api.com."""
    logger = _get_logger()
    try:
        if host.startswith("http://") or host.startswith("https://"):
            host = urlparse(host).hostname or host
        ip = socket.gethostbyname(host)
    except Exception as exc:
        logger.debug(f"DNS lookup failed for {host}: {exc}")
        ip = host
    url = f"http://ip-api.com/json/{ip}?fields=country"
    try:
        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=timeout)
        ) as session:
            async with session.get(url) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get("country")
    except Exception as exc:
        logger = _get_logger()
        logger.debug(f"Geo lookup failed for {host}: {exc}")
    return None
