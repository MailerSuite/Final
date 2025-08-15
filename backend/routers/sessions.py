from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, text
from sqlalchemy.exc import SQLAlchemyError
from core.database import get_db
from routers.auth import get_current_user
from models import Session as SessionModel
from schemas.session import (
    SessionCreate,
    SessionPublic,
    SessionDeleteResponse,
    ProxySelectionRequest,
)
from schemas.log import SessionLog
from services.session_service import SessionService
from services.log_service import LogService
from utils.api import build_paginated_response
from core.error_handlers import StandardErrorResponse
from utils.uuid_utils import stringify_uuids
from core.logger import get_logger
import uuid
from datetime import datetime

logger = get_logger(__name__)
router = APIRouter()

@router.get("/info")
async def sessions_info() -> Dict[str, Any]:
    """Sessions API information."""
    return {
        "service": "Sessions API",
        "version": "1.0.0",
        "description": "User session management and configuration",
        "endpoints": {
            "list": "/",
            "create": "/",
            "get": "/{session_id}",
            "update": "/{session_id}",  # ✅ Phase 2 Added
            "delete": "/{session_id}",
            "terminate": "/{session_id}/terminate",  # ✅ Phase 2 Added  
            "terminate_all": "/terminate-all",  # ✅ Phase 2 Added
            "active": "/active",  # ✅ Phase 2 Added
            "logs": "/{session_id}/logs",
            "proxy": "/{session_id}/proxy"
        },
        "phase2_enhancements": [
            "✅ Session update functionality",
            "✅ Session termination endpoints", 
            "✅ Active session tracking",
            "✅ Enhanced session security"
        ]
    }

def _normalize_session(session_row) -> SessionPublic:
    try:
        # Handle both SQLAlchemy Row objects and dict-like objects
        if hasattr(session_row, '_asdict'):
            data = session_row._asdict()
        elif hasattr(session_row, '__dict__'):
            data = {k: v for k, v in session_row.__dict__.items() if not k.startswith('_')}
        else:
            data = dict(session_row)
            
        # Ensure UUIDs are strings
        data = stringify_uuids(data)
        
        # Format datetime fields properly
        if data.get("created_at"):
            if hasattr(data["created_at"], "isoformat"):
                data["created_at"] = data["created_at"].isoformat()
        if data.get("updated_at"):
            if hasattr(data["updated_at"], "isoformat"):
                data["updated_at"] = data["updated_at"].isoformat()
                
        # Set default values for required fields if missing
        if "is_active" not in data:
            data["is_active"] = True
            
        return SessionPublic(**data)
    except Exception as e:
        logger.error(f"Error normalizing session: {e}, data: {data if 'data' in locals() else 'N/A'}")
        raise HTTPException(status_code=500, detail=f"Error processing session data: {str(e)}")

async def verify_session(session_id: str, user_id: str, db: AsyncSession) -> None:
    try:
        result = await db.execute(
            select(SessionModel).where(
                and_(SessionModel.id == session_id, SessionModel.user_id == user_id)
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Session not found or access denied"
            )
    except Exception as e:
        logger.error(f"Database error in verify_session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

def get_service(db: AsyncSession = Depends(get_db)) -> SessionService:
    try:
        return SessionService(db)
    except Exception as e:
        logger.error(f"Failed to initialize session service: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Service initialization failed"
        )

def _service_dep(db: AsyncSession = Depends(get_db)) -> SessionService:
    return get_service(db)

@router.post(
    "/",
    response_model=SessionPublic,
    summary="Create session",
    responses={401: {"model": StandardErrorResponse}, 422: {"description": "Validation Error"}},
)
async def create_session(
    session: SessionCreate,
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        # Check if session with same name exists for this user
        existing_query = select(SessionModel).where(
            and_(SessionModel.name == session.name, SessionModel.user_id == current_user.id)
        )
        existing_result = await db.execute(existing_query)
        existing = existing_result.scalar_one_or_none()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session name already exists",
            )
        
        # Create new session
        session_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        new_session = SessionModel(
            id=session_id,
            name=session.name,
            user_id=current_user.id,
            created_at=now
        )
        
        db.add(new_session)
        await db.commit()
        await db.refresh(new_session)
        
        return _normalize_session(new_session)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database error creating session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

@router.get(
    "/",
    summary="List sessions (paginated)",
    responses={401: {"model": StandardErrorResponse}},
)
async def list_sessions(
    db = Depends(get_db),
    current_user=Depends(get_current_user),
    limit: int = 50,
    offset: int = 0,
    fields: str | None = None,
):
    try:
        # Use raw SQL instead of SQLAlchemy model due to mapping issues
        # Count total
        total_res = await db.execute(text("""
            SELECT COUNT(*) FROM sessions WHERE user_id = :user_id
        """), {"user_id": current_user.id})
        total = total_res.scalar_one()

        # Page query
        result = await db.execute(text("""
            SELECT id, name, description, user_id, active_proxy_id, is_active, created_at, updated_at
            FROM sessions
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """), {"user_id": current_user.id, "limit": limit, "offset": offset})

        sessions = result.fetchall()

        sessions_data: List[Dict[str, Any]] = []
        for session in sessions:
            try:
                session_dict = {
                    "id": str(session.id),
                    "name": session.name,
                    "description": session.description,
                    "user_id": str(session.user_id),
                    "active_proxy_id": str(session.active_proxy_id) if session.active_proxy_id else None,
                    "is_active": bool(session.is_active) if session.is_active is not None else True,
                    "created_at": session.created_at.isoformat() if session.created_at else None,
                }
                sessions_data.append(session_dict)
            except Exception as e:
                logger.error(f"Error processing session {session.id}: {e}")
                continue

        field_list = [f.strip() for f in fields.split(",") if f.strip()] if fields else None
        return build_paginated_response(sessions_data, total=total, limit=limit, offset=offset, fields=field_list)
    except Exception as e:
        logger.error(f"Database error listing sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

@router.get(
    "/{session_id}",
    response_model=SessionPublic,
    summary="Get session",
    responses={401: {"model": StandardErrorResponse}, 404: {"description": "Not Found"}},
)
async def get_session(
    session_id: str,
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        query = select(SessionModel).where(
            and_(SessionModel.id == session_id, SessionModel.user_id == current_user.id)
        )
        result = await db.execute(query)
        session = result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
            )
        return _normalize_session(session)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database error getting session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

@router.get(
    "/{session_id}/logs",
    response_model=List[SessionLog],
    summary="Get session logs",
    responses={401: {"model": StandardErrorResponse}, 404: {"description": "Not Found"}},
)
async def get_session_logs(
    session_id: str,
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        await verify_session(session_id, current_user.id, db)
        return await LogService.get_session_logs(db, session_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get session logs"
        )

@router.delete(
    "/{session_id}",
    response_model=SessionDeleteResponse,
    summary="Delete session",
    responses={401: {"model": StandardErrorResponse}, 404: {"description": "Not Found"}},
)
async def delete_session(
    session_id: str,
    service: SessionService = Depends(_service_dep),
    current_user=Depends(get_current_user),
):
    try:
        deleted = await service.delete_session(session_id, current_user.id)
        from uuid import UUID
        return SessionDeleteResponse(id=UUID(str(deleted.id)), detail="Session deleted")
    except SQLAlchemyError as e:
        logger.error(f"Database error deleting session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete session"
        )

@router.post("/{session_id}/proxy", response_model=SessionPublic)
async def select_proxy(
    session_id: str,
    payload: ProxySelectionRequest,
    service: SessionService = Depends(_service_dep),
    current_user=Depends(get_current_user),
):
    try:
        session = await service.set_proxy(
            session_id, current_user.id, str(payload.proxy_id)
        )
        return session
    except SQLAlchemyError as e:
        logger.error(f"Database error setting proxy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )
    except Exception as e:
        logger.error(f"Error setting proxy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to set proxy"
        )


# ============================================================================
# ✅ PHASE 2 ADVANCED: MISSING SESSION MANAGEMENT ENDPOINTS - NEWLY ADDED
# ============================================================================

@router.put("/{session_id}", response_model=SessionPublic)
async def update_session(
    session_id: str,
    session_update: SessionCreate,  # Reuse SessionCreate for updates
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update an existing session."""
    try:
        # Find existing session
        query = select(SessionModel).where(
            and_(SessionModel.id == session_id, SessionModel.user_id == current_user.id)
        )
        result = await db.execute(query)
        session = result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Update session fields
        session.name = session_update.name
        if hasattr(session_update, 'description'):
            session.description = session_update.description
        session.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(session)
        
        return _normalize_session(session)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating session {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update session"
        )


@router.post("/{session_id}/terminate", response_model=Dict[str, Any])
async def terminate_session(
    session_id: str,
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Terminate/logout a specific session."""
    try:
        # Find session
        query = select(SessionModel).where(
            and_(SessionModel.id == session_id, SessionModel.user_id == current_user.id)
        )
        result = await db.execute(query)
        session = result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Mark session as inactive
        session.is_active = False
        session.updated_at = datetime.utcnow()
        
        await db.commit()
        
        logger.info(f"Session {session_id} terminated by user {current_user.id}")
        
        return {
            "message": "Session terminated successfully",
            "session_id": session_id,
            "terminated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error terminating session {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to terminate session"
        )


@router.post("/terminate-all", response_model=Dict[str, Any])
async def terminate_all_sessions(
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Terminate all active sessions for the current user."""
    try:
        # Update all user sessions to inactive
        result = await db.execute(text("""
            UPDATE sessions 
            SET is_active = false, updated_at = :now
            WHERE user_id = :user_id AND is_active = true
        """), {
            "user_id": current_user.id,
            "now": datetime.utcnow()
        })
        
        await db.commit()
        terminated_count = result.rowcount
        
        logger.info(f"Terminated {terminated_count} sessions for user {current_user.id}")
        
        return {
            "message": "All sessions terminated successfully", 
            "terminated_count": terminated_count,
            "terminated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error terminating all sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to terminate sessions"
        )


@router.get("/active", response_model=List[SessionPublic])
async def get_active_sessions(
    db = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get all active sessions for the current user."""
    try:
        result = await db.execute(text("""
            SELECT id, name, description, user_id, active_proxy_id, is_active, created_at, updated_at
            FROM sessions 
            WHERE user_id = :user_id AND is_active = true
            ORDER BY updated_at DESC
        """), {"user_id": current_user.id})
        
        sessions = result.fetchall()
        
        # Convert to SessionPublic format
        sessions_data = []
        for session in sessions:
            try:
                session_dict = {
                    "id": str(session.id),
                    "name": session.name,
                    "description": session.description,
                    "user_id": str(session.user_id),
                    "active_proxy_id": str(session.active_proxy_id) if session.active_proxy_id else None,
                    "is_active": bool(session.is_active),
                    "created_at": session.created_at.isoformat() if session.created_at else None
                }
                sessions_data.append(SessionPublic(**session_dict))
            except Exception as e:
                logger.error(f"Error processing active session {session.id}: {e}")
                continue
        
        return sessions_data
        
    except Exception as e:
        logger.error(f"Error getting active sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get active sessions"
        )
