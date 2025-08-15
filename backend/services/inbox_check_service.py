from datetime import datetime

from models.inbox_check import InboxCheckStepResult


async def _check_domain(domain_id: int) -> None:
    pass


async def _render_template(template_id: int) -> None:
    pass


async def _connect_proxy(proxy_id: int) -> None:
    pass


async def _send_smtp(smtp_id: int) -> None:
    pass


async def _check_imap(inbox: str) -> None:
    pass


async def _run_step(name: str, coro) -> InboxCheckStepResult:
    ts = datetime.utcnow()
    try:
        await coro
        return InboxCheckStepResult(step=name, status="pass", timestamp=ts)
    except Exception as exc:
        return InboxCheckStepResult(
            step=name, status="fail", timestamp=ts, error=str(exc)
        )


async def run_inbox_check(
    domain_id: int,
    template_id: int,
    proxy_id: int,
    smtp_id: int,
    imap_inbox: str,
) -> list[InboxCheckStepResult]:
    steps = [
        _run_step("domain", _check_domain(domain_id)),
        _run_step("template", _render_template(template_id)),
        _run_step("proxy", _connect_proxy(proxy_id)),
        _run_step("smtp", _send_smtp(smtp_id)),
        _run_step("imap", _check_imap(imap_inbox)),
    ]
    return [await s for s in steps]
