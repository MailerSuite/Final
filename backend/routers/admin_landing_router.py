"""
Admin Landing Page Router
Handles admin endpoints for landing page content management
"""

import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import get_current_admin_user
from core.database import get_db
from models import User
from models.landing import (
    LandingSection, 
    LandingFeature, 
    LandingPricing,
    LandingLead,
    LandingAnalytics
)
from schemas import landing as schemas

router = APIRouter(prefix="/admin/landing", tags=["admin-landing"])
logger = logging.getLogger(__name__)


# Section Management
@router.get("/sections", response_model=List[schemas.LandingSectionResponse])
async def get_sections(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all landing page sections."""
    result = await db.execute(
        select(LandingSection).order_by(LandingSection.order_index)
    )
    sections = result.scalars().all()
    return [section.to_dict() for section in sections]


@router.post("/sections", response_model=schemas.LandingSectionResponse)
async def create_or_update_section(
    section_data: schemas.LandingSectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create or update a landing page section."""
    # Check if section exists
    result = await db.execute(
        select(LandingSection).where(
            LandingSection.section_type == section_data.section_type
        )
    )
    existing_section = result.scalar_one_or_none()
    
    if existing_section:
        # Update existing
        existing_section.content = section_data.content
        existing_section.is_active = section_data.is_active
        existing_section.order_index = section_data.order_index
        existing_section.updated_by = current_user.id
        await db.commit()
        await db.refresh(existing_section)
        return existing_section.to_dict()
    else:
        # Create new
        new_section = LandingSection(
            section_type=section_data.section_type,
            content=section_data.content,
            is_active=section_data.is_active,
            order_index=section_data.order_index,
            created_by=current_user.id,
            updated_by=current_user.id
        )
        db.add(new_section)
        await db.commit()
        await db.refresh(new_section)
        return new_section.to_dict()


@router.delete("/sections/{section_id}")
async def delete_section(
    section_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a landing page section."""
    result = await db.execute(
        delete(LandingSection).where(LandingSection.id == section_id)
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Section not found")
    return {"message": "Section deleted successfully"}


# Feature Management
@router.get("/features", response_model=List[schemas.LandingFeatureResponse])
async def get_features(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all landing page features."""
    result = await db.execute(
        select(LandingFeature).order_by(LandingFeature.order_index)
    )
    features = result.scalars().all()
    return [feature.to_dict() for feature in features]


@router.post("/features", response_model=schemas.LandingFeatureResponse)
async def create_feature(
    feature_data: schemas.LandingFeatureCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new landing page feature."""
    new_feature = LandingFeature(**feature_data.dict())
    db.add(new_feature)
    await db.commit()
    await db.refresh(new_feature)
    return new_feature.to_dict()


@router.put("/features/{feature_id}", response_model=schemas.LandingFeatureResponse)
async def update_feature(
    feature_id: UUID,
    feature_data: schemas.LandingFeatureCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update a landing page feature."""
    result = await db.execute(
        update(LandingFeature)
        .where(LandingFeature.id == feature_id)
        .values(**feature_data.dict())
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Feature not found")
    
    # Get updated feature
    updated_result = await db.execute(
        select(LandingFeature).where(LandingFeature.id == feature_id)
    )
    feature = updated_result.scalar_one()
    return feature.to_dict()


@router.delete("/features/{feature_id}")
async def delete_feature(
    feature_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a landing page feature."""
    result = await db.execute(
        delete(LandingFeature).where(LandingFeature.id == feature_id)
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Feature not found")
    return {"message": "Feature deleted successfully"}


# Pricing Management
@router.get("/pricing", response_model=List[schemas.LandingPricingResponse])
async def get_pricing_plans(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all pricing plans."""
    result = await db.execute(
        select(LandingPricing).order_by(LandingPricing.order_index)
    )
    plans = result.scalars().all()
    return [plan.to_dict() for plan in plans]


@router.post("/pricing", response_model=schemas.LandingPricingResponse)
async def create_pricing_plan(
    plan_data: schemas.LandingPricingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new pricing plan."""
    new_plan = LandingPricing(**plan_data.dict())
    db.add(new_plan)
    await db.commit()
    await db.refresh(new_plan)
    return new_plan.to_dict()


@router.put("/pricing/{plan_id}", response_model=schemas.LandingPricingResponse)
async def update_pricing_plan(
    plan_id: UUID,
    plan_data: schemas.LandingPricingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update a pricing plan."""
    result = await db.execute(
        update(LandingPricing)
        .where(LandingPricing.id == plan_id)
        .values(**plan_data.dict())
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Pricing plan not found")
    
    # Get updated plan
    updated_result = await db.execute(
        select(LandingPricing).where(LandingPricing.id == plan_id)
    )
    plan = updated_result.scalar_one()
    return plan.to_dict()


@router.delete("/pricing/{plan_id}")
async def delete_pricing_plan(
    plan_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a pricing plan."""
    result = await db.execute(
        delete(LandingPricing).where(LandingPricing.id == plan_id)
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Pricing plan not found")
    return {"message": "Pricing plan deleted successfully"}


# Lead Management
@router.get("/leads", response_model=List[schemas.LandingLeadResponse])
async def get_leads(
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get landing page leads."""
    result = await db.execute(
        select(LandingLead)
        .order_by(LandingLead.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    leads = result.scalars().all()
    return [lead.to_dict() for lead in leads]


@router.get("/leads/export")
async def export_leads(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Export all leads as CSV."""
    import csv
    import io
    
    result = await db.execute(
        select(LandingLead).order_by(LandingLead.created_at.desc())
    )
    leads = result.scalars().all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=[
            "email", "name", "company", "phone", "source",
            "created_at", "converted_to_user"
        ]
    )
    writer.writeheader()
    
    for lead in leads:
        writer.writerow({
            "email": lead.email,
            "name": lead.name or "",
            "company": lead.company or "",
            "phone": lead.phone or "",
            "source": lead.source,
            "created_at": lead.created_at.isoformat(),
            "converted_to_user": "Yes" if lead.converted_to_user else "No"
        })
    
    content = output.getvalue()
    
    from fastapi.responses import Response
    return Response(
        content=content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=landing_leads.csv"
        }
    )


# Analytics
@router.get("/analytics/summary")
async def get_analytics_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get landing page analytics summary."""
    # Get total leads
    leads_result = await db.execute(
        select(LandingLead)
    )
    total_leads = len(leads_result.scalars().all())
    
    # Get conversion rate
    converted_result = await db.execute(
        select(LandingLead).where(LandingLead.converted_to_user == True)
    )
    converted_leads = len(converted_result.scalars().all())
    
    conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0
    
    # Get recent page views (last 30 days)
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    views_result = await db.execute(
        select(LandingAnalytics)
        .where(LandingAnalytics.created_at >= thirty_days_ago)
        .where(LandingAnalytics.event_type == "page_view")
    )
    page_views = len(views_result.scalars().all())
    
    return {
        "total_leads": total_leads,
        "converted_leads": converted_leads,
        "conversion_rate": round(conversion_rate, 2),
        "page_views_30d": page_views,
        "sources": {
            "newsletter": await _count_leads_by_source(db, "newsletter"),
            "contact_form": await _count_leads_by_source(db, "contact_form"),
            "demo_request": await _count_leads_by_source(db, "demo_request")
        }
    }


async def _count_leads_by_source(db: AsyncSession, source: str) -> int:
    """Helper to count leads by source."""
    result = await db.execute(
        select(LandingLead).where(LandingLead.source == source)
    )
    return len(result.scalars().all())