from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.logger import get_logger
from models import SMTPAccount as SMTPAccountModel


logger = get_logger(__name__)


def _status_base_score(status: str | None) -> int:
    if not status:
        return 20
    s = (status or "").lower()
    if s in {"valid", "checked"}:
        return 100
    if s in {"none", "pending"}:
        return 40
    if s in {"invalid", "dead", "error"}:
        return 10
    return 20


def _compute_score(row: Any) -> float:
    """Compute a health score for an SMTP account.

    Inputs considered: status, response_time (lower is better), last_checked recency.
    Conservative, additive scoring to avoid destabilizing selection.
    """
    status = getattr(row, "status", None)
    base = _status_base_score(status)

    rt = getattr(row, "response_time", None)
    if rt is None:
        rt_penalty = 0
    else:
        try:
            rt_penalty = min(50.0, float(rt) * 5.0)
        except Exception:
            rt_penalty = 0

    last_checked = getattr(row, "last_checked", None)
    recency_bonus = 0.0
    if isinstance(last_checked, datetime):
        now = datetime.now(timezone.utc if last_checked.tzinfo else None)
        age = now - last_checked
        if age <= timedelta(hours=6):
            recency_bonus = 10.0
        elif age >= timedelta(hours=24):
            recency_bonus = -10.0

    score = float(base) - rt_penalty + recency_bonus
    if score < 0:
        score = 0.0
    if score > 120:
        score = 120.0
    return score


async def select_best_smtp_accounts(
    db: AsyncSession, session_id: str, limit: int = 10
) -> list[dict[str, Any]]:
    """Return best SMTP accounts for a session ordered by health score."""
    stmt = (
        select(
            SMTPAccountModel.id,
            SMTPAccountModel.session_id,
            getattr(SMTPAccountModel, "smtp_server", None) or getattr(SMTPAccountModel, "server", None),
            getattr(SMTPAccountModel, "smtp_port", None) or getattr(SMTPAccountModel, "port", None),
            SMTPAccountModel.email,
            getattr(SMTPAccountModel, "status", None),
            getattr(SMTPAccountModel, "last_checked", None),
            getattr(SMTPAccountModel, "response_time", None),
        ).where(SMTPAccountModel.session_id == session_id)
    )
    result = await db.execute(stmt)
    rows = result.all()
    scored: list[tuple[float, dict[str, Any]]] = []
    for row in rows:
        obj = row[0] if hasattr(row, "_mapping") and len(row) == 1 else row
        class R:
            pass
        r = R()
        try:
            mapping = obj._mapping  # type: ignore[attr-defined]
        except Exception:
            mapping = None
        if mapping:
            for k, v in mapping.items():
                setattr(r, k if isinstance(k, str) else str(k), v)
        else:
            r = obj  # type: ignore[assignment]
        score = _compute_score(r)
        scored.append(
            (
                score,
                {
                    "id": str(getattr(r, "id", "")),
                    "email": getattr(r, "email", None),
                    "server": getattr(r, "smtp_server", None) or getattr(r, "server", None),
                    "port": getattr(r, "smtp_port", None) or getattr(r, "port", None),
                    "status": getattr(r, "status", None),
                    "last_checked": getattr(r, "last_checked", None),
                    "response_time": getattr(r, "response_time", None),
                    "score": round(score, 2),
                },
            )
        )
    scored.sort(key=lambda t: t[0], reverse=True)
    return [item for _, item in scored[: max(1, limit)]]


async def adjust_smtp_score(
    db: AsyncSession,
    smtp_account_id: str,
    *,
    success: bool,
    response_time: float | None = None,
) -> None:
    """Lightweight feedback loop to update SMTP account health fields.

    - Incrementally adjusts `status` and `response_time` to influence future selection.
    - Conservative updates to avoid flapping; safe when columns are missing.
    """
    try:
        from models import SMTPAccount as SMTPAccountModel
        # Fetch row
        row = await db.get(SMTPAccountModel, smtp_account_id)
        if not row:
            return
        # Update response time if provided
        if response_time is not None and hasattr(row, "response_time"):
            try:
                # Exponential moving average with alpha=0.3
                old = float(getattr(row, "response_time") or 0.0)
                new = (old * 0.7) + (float(response_time) * 0.3)
                setattr(row, "response_time", new)
            except Exception:
                pass
        # Downgrade/upgrade status lightly
        if hasattr(row, "status"):
            s = (getattr(row, "status") or "").lower()
            if success and s in {"pending", "none", "invalid", "dead", "error", ""}:
                setattr(row, "status", "checked")
            if not success and s in {"checked", "valid"}:
                setattr(row, "status", "error")
        await db.commit()
    except Exception:
        # Best-effort; ignore on failure
        pass
