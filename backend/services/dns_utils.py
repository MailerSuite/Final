import aiodns
from async_lru import alru_cache

_resolver = None


def get_resolver():
    """Get or create DNS resolver instance"""
    global _resolver
    if _resolver is None:
        _resolver = aiodns.DNSResolver()
    return _resolver


@alru_cache(maxsize=128, ttl=600)
async def resolve_mx(domain: str) -> list[str]:
    resolver = get_resolver()
    answers = await resolver.query(domain, "MX")
    hosts = sorted((a.priority, a.host.rstrip(".")) for a in answers)
    return [h for _, h in hosts]


async def query_a_record(host: str, timeout: int = 5) -> bool:
    """Return True if *host* has an A record."""
    try:
        custom = aiodns.DNSResolver(timeout=timeout)
        await custom.query(host, "A")
        return True
    except aiodns.error.DNSError as e:
        if e.args and e.args[0] in (
            aiodns.error.ARES_ENODATA,
            aiodns.error.ARES_ENOTFOUND,
        ):
            return False
        raise
