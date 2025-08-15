
import dns.asyncresolver

from utils.discovery_utils import get_fallback_hosts


def get_imap_server_and_port(
    email: str, account_host: str | None = None
) -> tuple[str | None, int | None]:
    if account_host:
        return (account_host, 993)
    domain = email.split("@")[-1].lower()
    imap_servers = {
        "gmail.com": ("imap.gmail.com", 993),
        "outlook.com": ("outlook.office365.com", 993),
        "hotmail.com": ("outlook.office365.com", 993),
        "live.com": ("outlook.office365.com", 993),
        "yahoo.com": ("imap.mail.yahoo.com", 993),
        "yahoo.co.uk": ("imap.mail.yahoo.com", 993),
        "aol.com": ("imap.aol.com", 993),
        "icloud.com": ("imap.mail.me.com", 993),
        "me.com": ("imap.mail.me.com", 993),
        "mac.com": ("imap.mail.me.com", 993),
        "zoho.com": ("imap.zoho.com", 993),
        "mail.com": ("imap.mail.com", 993),
        "gmx.com": ("imap.gmx.net", 993),
        "yandex.com": ("imap.yandex.com", 993),
        "yandex.ru": ("imap.yandex.ru", 993),
        "mail.ru": ("imap.mail.ru", 993),
        "rambler.ru": ("imap.rambler.ru", 993),
    }
    if domain in imap_servers:
        return imap_servers[domain]
    else:
        possible_servers = [
            f"imap.{domain}",
            f"mail.{domain}",
            f"imap.mail.{domain}",
        ]
        return (possible_servers[0], 993)


async def discover_imap_host(account) -> tuple[str, int]:
    host = getattr(account, "imap_server", None)
    port = getattr(account, "imap_port", 993) or 993
    if host:
        return (host, port)
    email = getattr(account, "email", "")
    domain = email.split("@")[-1].lower()
    try:
        resolver = dns.asyncresolver.Resolver()
        answers = await resolver.resolve(f"_imaps._tcp.{domain}", "SRV")
        records = sorted(

                (r.priority, r.weight, r.target.to_text().rstrip("."), r.port)
                for r in answers

        )
        if records:
            host = records[0][2]
            port = records[0][3] or port
            return (host, port)
    except Exception:
        pass
    try:
        fallback = await get_fallback_hosts(domain)
    except Exception:
        fallback = [
            f"imap.{domain}",
            f"smtp.{domain}",
            f"mail.{domain}",
            domain,
        ]
    return (fallback[0], port)
