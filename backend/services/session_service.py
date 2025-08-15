from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.base import Campaign, Session


class SessionService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _get_session(
        self, session_id: str, user_id: str
    ) -> Session | None:
        result = await self.db.execute(
            select(Session).where(
                Session.id == session_id, Session.user_id == user_id
            )
        )
        return result.scalar_one_or_none()

    async def delete_session(self, session_id: str, user_id: str) -> Session:
        session = await self._get_session(session_id, user_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )
        result = await self.db.execute(
            select(func.count())
            .select_from(Campaign)
            .where(Campaign.session_id == session_id)
        )
        if result.scalar_one() > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session has associated campaigns and cannot be deleted",
            )
        try:
            await self.db.delete(session)
            await self.db.commit()
            return session
        except Exception:
            await self.db.rollback()
            raise

    async def set_proxy(
        self, session_id: str, user_id: str, proxy_id: str
    ) -> Session:
        session = await self._get_session(session_id, user_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )
        session.active_proxy_id = proxy_id
        try:
            await self.db.commit()
            await self.db.refresh(session)
            return session
        except Exception:
            await self.db.rollback()
            raise
