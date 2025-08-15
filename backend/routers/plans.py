
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app_websockets.connection_manager import ConnectionManager
from core.database import get_db
from models.plan import Plan, PlanStatus, TeamPlan
from schemas.plans import PlanResponse
from services.plan_service import PlanService

# Initialize manager
manager = ConnectionManager()

router = APIRouter()


def get_service(db=Depends(get_db)) -> PlanService:
    return PlanService(db)


@router.get("/", response_model=list[PlanResponse])
async def list_plans(service: PlanService = Depends(get_service)):
    """Get all active plans with current pricing and features"""
    plans = await service.list_plans()
    return [PlanResponse.model_validate(p) for p in plans]


@router.get("/lifetime/status")
async def get_lifetime_status(db: AsyncSession = Depends(get_db)):
    """Get Lifetime plan availability for scarcity counter"""
    try:
        result = await db.execute(
            select(PlanStatus).where(PlanStatus.plan_code == "lifetime")
        )
        status = result.scalar_one_or_none()

        if not status:
            return {
                "available_seats": 50,
                "total_seats": 50,
                "sold_seats": 0,
                "percentage_sold": 0,
            }

        available_seats = status.total_seats - status.sold_seats
        percentage_sold = (status.sold_seats / status.total_seats) * 100

        return {
            "available_seats": available_seats,
            "total_seats": status.total_seats,
            "sold_seats": status.sold_seats,
            "percentage_sold": round(percentage_sold, 1),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching lifetime status: {str(e)}"
        )


@router.post("/lifetime/purchase")
async def purchase_lifetime_seat(db: AsyncSession = Depends(get_db)):
    """Simulate purchasing a lifetime seat and update counter"""
    try:
        result = await db.execute(
            select(PlanStatus).where(PlanStatus.plan_code == "lifetime")
        )
        status = result.scalar_one_or_none()

        if not status:
            raise HTTPException(
                status_code=404, detail="Lifetime plan status not found"
            )

        if status.sold_seats >= status.total_seats:
            raise HTTPException(
                status_code=400, detail="No more lifetime seats available"
            )

        # Update sold seats count
        status.sold_seats += 1
        await db.commit()

        # Broadcast update to all connected clients
        available_seats = status.total_seats - status.sold_seats
        await manager.broadcast_to_all(
            {
                "type": "lifetime_update",
                "data": {
                    "available_seats": available_seats,
                    "total_seats": status.total_seats,
                    "sold_seats": status.sold_seats,
                },
            }
        )

        return {
            "message": "Lifetime seat purchased successfully",
            "available_seats": available_seats,
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error purchasing lifetime seat: {str(e)}"
        )


@router.get("/team/{team_id}")
async def get_team_plan(team_id: int, db: AsyncSession = Depends(get_db)):
    """Get team plan details"""
    try:
        result = await db.execute(
            select(TeamPlan).where(TeamPlan.id == team_id)
        )
        team_plan = result.scalar_one_or_none()

        if not team_plan:
            raise HTTPException(status_code=404, detail="Team plan not found")

        return {
            "id": team_plan.id,
            "team_name": team_plan.team_name,
            "current_seats": team_plan.current_seats,
            "max_seats": team_plan.max_seats,
            "price_per_seat": team_plan.price_per_seat,
            "total_cost": team_plan.current_seats * team_plan.price_per_seat,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching team plan: {str(e)}"
        )


@router.get("/features/{plan_code}")
async def get_plan_features(
    plan_code: str, db: AsyncSession = Depends(get_db)
):
    """Get detailed features for a specific plan"""
    try:
        result = await db.execute(
            select(Plan).where(Plan.code == plan_code, Plan.is_active == True)
        )
        plan = result.scalar_one_or_none()

        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")

        return {
            "code": plan.code,
            "name": plan.name,
            "price": plan.price_per_month,
            "features": plan.features,
            "allowed_functions": plan.allowed_functions,
            "limits": {
                "max_threads": plan.max_threads,
                "max_ai_calls_daily": plan.max_ai_calls_daily,
                "max_ai_tokens_monthly": plan.max_ai_tokens_monthly,
                "max_concurrent_sessions": plan.max_concurrent_sessions,
            },
            "support": {
                "has_premium_support": plan.has_premium_support,
                "update_frequency": plan.update_frequency,
            },
            "marketing_blurb": plan.marketing_blurb,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching plan features: {str(e)}"
        )
