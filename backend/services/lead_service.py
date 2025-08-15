import csv
import io
from uuid import UUID

from email_validator import EmailNotValidError, validate_email
from fastapi import HTTPException, UploadFile
from sqlalchemy import case, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.logger import get_logger
from models.base import LeadBase, LeadEntry
from schemas.leads import (
    LeadBaseCreate,
    LeadBaseResponse,
    LeadBaseUpdate,
    LeadEntryList,
    LeadEntryResponse,
    LeadEntryUpdate,
    LeadEntrySimple,
    LeadEntryCursorPage,
    LeadEntryCreateInBase,
    UploadResult,
)

logger = get_logger(__name__)


class LeadService:
    """Service for lead management."""

    def __init__(self, db: AsyncSession):
        """Initialize service with database session."""
        self.db = db

    async def get_lead_bases(
        self,
        owner_id: UUID,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
    ) -> list[LeadBaseResponse]:
        """Get user's lead databases list."""
        stmt = select(LeadBase).where(LeadBase.owner_id == owner_id)
        if search:
            stmt = stmt.where(LeadBase.name.ilike(f"%{search}%"))
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        bases = result.scalars().all()
        return [LeadBaseResponse.model_validate(base) for base in bases]

    async def _get_base(self, base_id: UUID, owner_id: UUID) -> LeadBase:
        result = await self.db.execute(
            select(LeadBase).where(LeadBase.id == base_id)
        )
        base = result.scalar_one_or_none()
        if not base:
            raise HTTPException(status_code=404, detail="Lead base not found")
        if base.owner_id != owner_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        return base

    async def get_lead_base(
        self, base_id: UUID, owner_id: UUID
    ) -> LeadBaseResponse:
        base = await self._get_base(base_id, owner_id)
        return LeadBaseResponse.model_validate(base)

    async def create_lead_base(
        self, base_data: LeadBaseCreate, owner_id: UUID
    ) -> LeadBaseResponse:
        """Create new lead database."""
        db_base = LeadBase(owner_id=owner_id, **base_data.model_dump())
        self.db.add(db_base)
        await self.db.commit()
        await self.db.refresh(db_base)
        logger.info(f"Created lead base: {db_base.name} (ID: {db_base.id})")
        return LeadBaseResponse.model_validate(db_base)

    async def update_lead_base(
        self, base_id: UUID, base_data: LeadBaseUpdate, owner_id: UUID
    ) -> LeadBaseResponse:
        """Update lead database."""
        db_base = await self._get_base(base_id, owner_id)
        update_data = base_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_base, field, value)
        await self.db.commit()
        await self.db.refresh(db_base)
        logger.info(f"Updated lead base: {db_base.id}")
        return LeadBaseResponse.model_validate(db_base)

    async def delete_lead_base(self, base_id: UUID, owner_id: UUID) -> dict:
        """Delete lead database."""
        db_base = await self._get_base(base_id, owner_id)
        leads_count = db_base.leads_count
        await self.db.delete(db_base)
        await self.db.commit()
        logger.info(f"Deleted lead base: {base_id} with {leads_count} leads")
        return {"message": f"Lead base deleted with {leads_count} leads"}

    async def get_leads(
        self,
        base_id: UUID,
        owner_id: UUID,
        skip: int = 0,
        limit: int = 50,
        search: str | None = None,
    ) -> LeadEntryList:
        """Get list of leads in database."""
        await self._get_base(base_id, owner_id)
        stmt = select(LeadEntry).where(LeadEntry.lead_base_id == base_id)
        if search:
            stmt = stmt.where(
                or_(
                    LeadEntry.email.ilike(f"%{search}%"),
                    LeadEntry.first_name.ilike(f"%{search}%"),
                    LeadEntry.last_name.ilike(f"%{search}%"),
                )
            )
        count_stmt = select(func.count()).select_from(stmt.subquery())
        result = await self.db.execute(count_stmt)
        total = result.scalar_one()
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        leads = result.scalars().all()
        return LeadEntryList(
            leads=[LeadEntryResponse.model_validate(lead) for lead in leads],
            total=total,
            page=skip // limit + 1,
            per_page=limit,
            total_pages=(total + limit - 1) // limit,
        )

    async def get_leads_cursor(
        self,
        base_id: UUID,
        owner_id: UUID,
        cursor: str | None = None,
        limit: int = 1000,
        search: str | None = None,
    ) -> LeadEntryCursorPage:
        """High-throughput cursor-based listing for very large bases.

        - Uses created_at/id tuple cursor to avoid deep OFFSET scans.
        - Returns compact schema to reduce payload size.
        """
        await self._get_base(base_id, owner_id)
        stmt = select(LeadEntry).where(LeadEntry.lead_base_id == base_id)
        if search:
            stmt = stmt.where(
                or_(
                    LeadEntry.email.ilike(f"%{search}%"),
                    LeadEntry.first_name.ilike(f"%{search}%"),
                    LeadEntry.last_name.ilike(f"%{search}%"),
                )
            )
        # Cursor format: "{created_at_ts}:{id}"
        if cursor:
            try:
                created_at_ts, id_str = cursor.split(":", 1)
                # Compare by created_at then id for stable ordering
                stmt = stmt.where(
                    or_(
                        LeadEntry.created_at < func.to_timestamp(created_at_ts),
                        func.and_(
                            LeadEntry.created_at == func.to_timestamp(created_at_ts),
                            LeadEntry.id < id_str,
                        ),
                    )
                )
            except Exception:
                # Ignore invalid cursor
                pass
        stmt = stmt.order_by(LeadEntry.created_at.desc(), LeadEntry.id.desc()).limit(limit)
        result = await self.db.execute(stmt)
        rows = result.scalars().all()
        items = [
            LeadEntrySimple(
                id=row.id,
                email=row.email,
                first_name=row.first_name,
                last_name=row.last_name,
                lead_base_id=row.lead_base_id,
                created_at=row.created_at,
            )
            for row in rows
        ]
        next_cursor = None
        if items:
            last = items[-1]
            next_cursor = f"{int(last.created_at.timestamp())}:{last.id}"
        return LeadEntryCursorPage(items=items, next_cursor=next_cursor)

    async def _get_lead(self, lead_id: UUID, owner_id: UUID) -> LeadEntry:
        result = await self.db.execute(
            select(LeadEntry).where(LeadEntry.id == lead_id)
        )
        lead = result.scalar_one_or_none()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        await self._get_base(lead.lead_base_id, owner_id)
        return lead

    async def create_lead_in_base(
        self, base_id: UUID, owner_id: UUID, data: LeadEntryCreateInBase
    ) -> LeadEntryResponse:
        """Create a single lead within a base (fast path)."""
        await self._get_base(base_id, owner_id)
        # Optional: lightweight duplicate check by email within base
        exists = await self.db.execute(
            select(func.count()).select_from(LeadEntry).where(
                LeadEntry.lead_base_id == base_id, LeadEntry.email == data.email
            )
        )
        if exists.scalar() > 0:
            raise HTTPException(status_code=409, detail="Lead already exists")
        lead = LeadEntry(
            email=data.email.lower(),
            first_name=data.first_name,
            last_name=data.last_name,
            lead_base_id=base_id,
            user_id=owner_id,
        )
        self.db.add(lead)
        await self.db.commit()
        await self.db.refresh(lead)
        await self._update_base_counters(base_id)
        return LeadEntryResponse.model_validate(lead)

    async def get_lead(
        self, lead_id: UUID, owner_id: UUID
    ) -> LeadEntryResponse:
        lead = await self._get_lead(lead_id, owner_id)
        return LeadEntryResponse.model_validate(lead)

    async def update_lead(
        self, lead_id: UUID, lead_data: LeadEntryUpdate, owner_id: UUID
    ) -> LeadEntryResponse:
        """Update lead."""
        db_lead = await self._get_lead(lead_id, owner_id)
        update_data = lead_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_lead, field, value)
        await self.db.commit()
        await self.db.refresh(db_lead)
        if update_data:
            await self._update_base_counters(db_lead.lead_base_id)
        logger.info(f"Updated lead: {lead_id}")
        return LeadEntryResponse.model_validate(db_lead)

    async def delete_lead(self, lead_id: UUID, owner_id: UUID) -> dict:
        """Delete lead."""
        db_lead = await self._get_lead(lead_id, owner_id)
        base_id = db_lead.lead_base_id
        await self.db.delete(db_lead)
        await self.db.commit()
        await self._update_base_counters(base_id)
        logger.info(f"Deleted lead: {lead_id}")
        return {"message": "Lead deleted successfully"}

    async def upload_csv(
        self, base_id: UUID, file: UploadFile, owner_id: UUID
    ) -> UploadResult:
        """Upload CSV file with leads."""
        await self._get_base(base_id, owner_id)
        if not file.filename.lower().endswith((".csv", ".txt")):
            raise HTTPException(
                status_code=400, detail="Only CSV and TXT files are supported"
            )
        try:
            content = await file.read()
            content_str = content.decode("utf-8")
            csv_reader = csv.DictReader(io.StringIO(content_str))
            total_processed = 0
            successful_imports = 0
            duplicates_skipped = 0
            invalid_emails = 0
            errors = []
            emails_result = await self.db.execute(
                select(LeadEntry.email).where(
                    LeadEntry.lead_base_id == base_id
                )
            )
            existing_emails = set(row[0] for row in emails_result.all())
            for row_num, row in enumerate(csv_reader, start=2):
                total_processed += 1
                try:
                    email = row.get("email", "").strip().lower()
                    first_name = row.get("first_name", "").strip()
                    last_name = row.get("last_name", "").strip()
                    if not email:
                        errors.append(f"Row {row_num}: Email is required")
                        continue
                    if email in existing_emails:
                        duplicates_skipped += 1
                        continue
                    try:
                        validate_email(email)
                        email_verified = True
                    except EmailNotValidError:
                        email_verified = False
                        invalid_emails += 1
                    lead = LeadEntry(
                        email=email,
                        first_name=first_name if first_name else None,
                        last_name=last_name if last_name else None,
                        email_verified=email_verified,
                        lead_base_id=base_id,
                    )
                    self.db.add(lead)
                    existing_emails.add(email)
                    successful_imports += 1
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
            await self.db.commit()
            await self._update_base_counters(base_id)
            logger.info(
                f"CSV upload completed for base {base_id}: {successful_imports}/{total_processed} imported"
            )
            return UploadResult(
                message=f"Successfully processed {total_processed} records",
                total_processed=total_processed,
                successful_imports=successful_imports,
                duplicates_skipped=duplicates_skipped,
                invalid_emails=invalid_emails,
                errors=errors[:10],
            )
        except Exception as e:
            await self.db.rollback()
            logger.error(f"CSV upload failed: {str(e)}")
            raise HTTPException(
                status_code=400, detail=f"CSV processing failed: {str(e)}"
            )

    async def validate_lead_email(self, lead_id: UUID, owner_id: UUID) -> dict:
        lead = await self._get_lead(lead_id, owner_id)
        try:
            validate_email(lead.email)
            lead.email_verified = True
            lead.validation_error = None
        except EmailNotValidError as e:
            lead.email_verified = False
            lead.validation_error = str(e)
        lead.last_validated = func.now()
        await self.db.commit()
        await self._update_base_counters(lead.lead_base_id)
        return {
            "message": "Email validation completed",
            "lead_id": lead_id,
            "email_verified": lead.email_verified,
            "error": lead.validation_error,
        }

    async def _update_base_counters(self, base_id: UUID) -> None:
        """Update counters in lead database."""
        result = await self.db.execute(
            select(LeadBase).where(LeadBase.id == base_id)
        )
        base = result.scalar_one_or_none()
        if not base:
            return
        stats_result = await self.db.execute(
            select(
                func.count(LeadEntry.id).label("total"),
                func.sum(
                    case((LeadEntry.email_verified.is_(True), 1), else_=0)
                ).label("verified"),
            ).where(LeadEntry.lead_base_id == base_id)
        )
        stats = stats_result.first()
        total = stats.total or 0
        verified = stats.verified or 0
        await self.db.execute(
            update(LeadBase)
            .where(LeadBase.id == base_id)
            .values(
                leads_count=total,
                valid_count=verified,
                invalid_count=total - verified,
            )
        )
        await self.db.commit()
