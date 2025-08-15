
from sqlalchemy.ext.asyncio import AsyncSession

from schemas.log import SessionLog


class LogService:
    """Service for fetching logs from the database."""

    @staticmethod
    async def get_session_logs(
        db: AsyncSession, session_id: str
    ) -> list[SessionLog]:
        rows = result = await db.execute(
            "SELECT id, created_at, level, message\n               FROM session_logs\n               WHERE session_id = $1\n               ORDER BY created_at",
            session_id,
        )
        return [SessionLog(**dict(r)) for r in rows]
