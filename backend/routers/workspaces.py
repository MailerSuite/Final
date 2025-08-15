"""
Workspaces Router

Workspace is a first-class alias for the existing Session model, giving each user
isolated contexts where they can bind different resources (SMTP, templates, configs).
This provides a gentler migration path to full workspace isolation while reusing
stable storage.
"""
from __future__ import annotations

from typing import Any, Dict, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from routers.auth import get_current_user
from models import Session as SessionModel

router = APIRouter(prefix="/api/v1/workspaces", tags=["Workspaces"])


def _to_workspace_dict(row) -> Dict[str, Any]:
    return {
        "id": str(row.id),
        "name": row.name,
        "description": row.description,
        "is_active": bool(row.is_active) if getattr(row, "is_active", None) is not None else True,
        "created_at": row.created_at.isoformat() if getattr(row, "created_at", None) else None,
        "updated_at": row.updated_at.isoformat() if getattr(row, "updated_at", None) else None,
    }


@router.get("")
async def list_workspaces(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)) -> Dict[str, Any]:
    result = await db.execute(
        text(
            """
            SELECT id, name, description, user_id, is_active, created_at, updated_at
            FROM sessions
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            """
        ),
        {"user_id": current_user.id},
    )
    rows = result.fetchall()
    items = [_to_workspace_dict(r) for r in rows]
    return {"items": items, "total": len(items)}


@router.post("")
async def create_workspace(payload: Dict[str, Any], db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)) -> Dict[str, Any]:
    name = payload.get("name") or "New Workspace"
    description = payload.get("description")

    existing = await db.execute(
        select(SessionModel).where(and_(SessionModel.user_id == current_user.id, SessionModel.name == name))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Workspace name already exists")

    ws = SessionModel(id=None, name=name, description=description, user_id=current_user.id)
    db.add(ws)
    await db.commit()
    await db.refresh(ws)
    return _to_workspace_dict(ws)


@router.get("/{workspace_id}")
async def get_workspace(workspace_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)) -> Dict[str, Any]:
    result = await db.execute(
        select(SessionModel).where(and_(SessionModel.id == workspace_id, SessionModel.user_id == current_user.id))
    )
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return _to_workspace_dict(ws)


@router.put("/{workspace_id}")
async def update_workspace(
    workspace_id: str,
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    result = await db.execute(
        select(SessionModel).where(and_(SessionModel.id == workspace_id, SessionModel.user_id == current_user.id))
    )
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    if "name" in payload and payload["name"]:
        ws.name = payload["name"]
    if "description" in payload:
        ws.description = payload["description"]
    ws.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(ws)
    return _to_workspace_dict(ws)


@router.delete("/{workspace_id}")
async def delete_workspace(workspace_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)) -> Dict[str, Any]:
    result = await db.execute(
        select(SessionModel).where(and_(SessionModel.id == workspace_id, SessionModel.user_id == current_user.id))
    )
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    await db.delete(ws)
    await db.commit()
    return {"message": "Workspace deleted", "id": workspace_id}


@router.post("/{workspace_id}/activate")
async def activate_workspace(workspace_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)) -> Dict[str, Any]:
    # Deactivate others, activate selected
    await db.execute(
        text(
            """
            UPDATE sessions SET is_active = false, updated_at = :now WHERE user_id = :user_id AND is_active = true
            """
        ),
        {"user_id": current_user.id, "now": datetime.utcnow()},
    )
    result = await db.execute(
        select(SessionModel).where(and_(SessionModel.id == workspace_id, SessionModel.user_id == current_user.id))
    )
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    ws.is_active = True
    ws.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(ws)
    return _to_workspace_dict(ws)
