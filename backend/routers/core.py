"""
Core API Router
Handles core application endpoints.
"""

import logging
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/")
async def core_info(response: Response, if_none_match: str | None = Header(default=None)):
    """Core API information endpoint."""
    etag = 'W/"core-info-v1"'
    if if_none_match == etag:
        response.status_code = 304
        return {}
    response.headers["ETag"] = etag
    return {
        "service": "Core API",
        "version": "1.0.0",
        "description": "Core application endpoints",
        "features": ["System information"],
        "endpoints": {},
    }


# All payment/wallet endpoints removed
