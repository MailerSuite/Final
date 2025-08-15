from datetime import datetime

import aiohttp
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.base import Domain as DomainModel
from schemas.domain import DomainCreate, DomainStatus, DomainUpdate
from services.blacklist_service import BlacklistService
from utils.geo_utils import lookup_country


class DomainService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_domains(self) -> list[DomainModel]:
        result = await self.db.execute(
            select(DomainModel).order_by(DomainModel.created_at.desc())
        )
        return result.scalars().all()

    async def get_domain(self, domain_id: str) -> DomainModel:
        result = await self.db.execute(
            select(DomainModel).where(DomainModel.id == domain_id)
        )
        domain = result.scalar_one_or_none()
        if not domain:
            raise HTTPException(status_code=404, detail="Domain not found")
        return domain

    async def create_domain(self, data: DomainCreate) -> DomainModel:
        obj = DomainModel(**data.model_dump())
        if data.url:
            obj.country = await lookup_country(data.url)
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def update_domain(
        self, domain_id: str, data: DomainUpdate
    ) -> DomainModel:
        domain = await self.get_domain(domain_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(domain, field, value)
        if data.url and (not data.country):
            domain.country = await lookup_country(data.url)
        await self.db.commit()
        await self.db.refresh(domain)
        return domain

    async def delete_domain(self, domain_id: str) -> None:
        domain = await self.get_domain(domain_id)
        await self.db.delete(domain)
        await self.db.commit()

    async def check_domain(
        self, domain: DomainModel, timeout: int = 5
    ) -> DomainModel:
        start = datetime.utcnow()
        try:
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=timeout)
            ) as session:
                async with session.get(domain.url) as resp:
                    domain.response_time = (
                        datetime.utcnow() - start
                    ).total_seconds()
                    domain.status = (
                        DomainStatus.CHECKED
                        if resp.status < 400
                        else DomainStatus.DEAD
                    )
                    domain.last_checked = datetime.utcnow()
                    if not domain.country:
                        domain.country = await lookup_country(domain.url)
                    domain.error_message = None
        except Exception as e:
            domain.status = DomainStatus.DEAD
            domain.response_time = (datetime.utcnow() - start).total_seconds()
            domain.last_checked = datetime.utcnow()
            domain.error_message = str(e)
        self.db.add(domain)
        await self.db.commit()
        await self.db.refresh(domain)
        return domain

    async def blacklist_check(self, url: str):
        pool = await Database.get_pool()
        async with pool.acquire() as connection:
            checker = BlacklistService(connection)
            result = await checker.check_domain_blacklist_detailed(url)
        return result
