import os
from functools import lru_cache

import aiodns
import dns.resolver

MAX_CONCURRENT_PROBES = int(os.getenv("MAX_CONCURRENT_PROBES", "50"))
ALLOW_INSECURE = os.getenv("ALLOW_INSECURE", "false").lower() == "true"
CONNECT_TIMEOUT = 4
AUTH_TIMEOUT = 4
_BASE_PREFIXES = ["smtp", "mail"]
_EXTRA_PREFIXES = [
    p.strip()
    for p in os.getenv("SMTP_HOST_PREFIXES", "").split(",")
    if p.strip()
]


@lru_cache(maxsize=2048)
def host_permutations(domain: str) -> list[str]:
    prefixes = _BASE_PREFIXES + _EXTRA_PREFIXES
    return [f"{p}.{domain}" for p in prefixes] + [domain]


@lru_cache(maxsize=4)
def port_security_matrix(
    allow_insecure: bool = ALLOW_INSECURE,
) -> list[tuple[int, str]]:
    matrix = [(587, "starttls"), (465, "ssl"), (2525, "starttls")]
    if allow_insecure:
        matrix.append((25, "plain"))
    return matrix


_resolver = aiodns.DNSResolver()


@lru_cache(maxsize=2048)
async def mx_lookup(domain: str) -> list[str]:
    try:
        answers = await _resolver.query(domain, "MX")
        hosts = sorted(answers, key=lambda r: r.priority)
        return [a.host.rstrip(".") for a in hosts]
    except Exception:
        try:
            answers = dns.resolver.resolve(domain, "MX")
            hosts = sorted(answers, key=lambda r: r.preference)
            return [a.exchange.to_text().rstrip(".") for a in hosts]
        except Exception:
            return []
