
import dns.asyncresolver

from core.logger import get_logger

logger = get_logger(__name__)


async def get_fallback_hosts(domain: str) -> list[str]:
    fallback = [f"imap.{domain}", f"smtp.{domain}", f"mail.{domain}", domain]
    try:
        resolver = dns.asyncresolver.Resolver()
        answers = await resolver.resolve(domain, "MX")
        records = sorted(
            (r.preference, r.exchange.to_text().rstrip(".")) for r in answers
        )
        hosts = [h for _, h in records]
        return fallback + hosts if hosts else fallback
    except Exception as exc:
        logger.debug(f"MX lookup failed for {domain}: {exc}")
        return fallback
