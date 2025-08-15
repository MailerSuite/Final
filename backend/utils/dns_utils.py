import asyncio

import dns.resolver


async def resolve_mx(domain: str, timeout: int = 5) -> list[str]:
    def _query() -> list[str]:
        resolver = dns.resolver.Resolver()
        resolver.lifetime = timeout
        answers = resolver.resolve(domain, "MX")
        records = sorted(
            (r.preference, r.exchange.to_text().rstrip(".")) for r in answers
        )
        return [host for _, host in records]

    return await asyncio.to_thread(_query)
