import asyncio
from json import JSONDecodeError
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError
from sqlmodel import select

from config.settings import settings
from core.database import get_db
from models.check_result import CheckResult
from schemas.check_result import CheckResultRead, CheckResultUpdate
from schemas.smtp import (
    SMTPCheckRequest,
    SMTPCred,
    SMTPCredBulkResponse,
    SMTPCredResult,
    SMTPImportRequest,
    SMTPImportResponse,
    SMTPToolRequest,
)
from services.handshake_service import handshake_service
from services.proxy_service import ProxyService
from services.smtp_discovery import SMTPDiscoveryService
from services.smtp_probe import (
    ErrorCode,
    SMTPProbe,
    SMTPProbeError,
    SMTPProbeResult,
)
from services.smtp_service import SMTPCheckService, SMTPTester
from services.thread_pool_service import global_thread_pool
from utils.check_logging import log_check_result

router = APIRouter()


def get_service() -> SMTPCheckService:
    """Dependency that returns a default ``SMTPCheckService``."""
    return SMTPCheckService()


class SMTPCheckResponse(BaseModel):
    success: bool
    response_time: float | None = None


class BulkCheckRequest(BaseModel):
    hosts: list[str]
    port: int = 25
    username: str
    password: str
    timeout: int = 30


class BulkCheckResult(BaseModel):
    host: str
    success: bool
    last_response: float | None
    last_error: str | None


@router.post("/smtp-check")
async def smtp_check_tool(
    request: Request, service: SMTPCheckService = Depends(get_service)
) -> dict:
    """Run SMTP checks on the provided ports using ``SMTPCheckService``."""
    try:
        data = await request.json()
    except JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    try:
        payload = SMTPToolRequest(**data)
    except ValidationError as err:
        raise HTTPException(status_code=422, detail=err.errors())
    results = await service.check(
        payload.host, payload.email, payload.password, timeout=payload.timeout
    )
    return {"results": results}


@router.post("/check", response_model=SMTPCheckResponse)
async def smtp_check(request: Request, db=Depends(get_db)):
    try:
        data = await request.json()
    except JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    try:
        payload = SMTPCheckRequest(**data)
    except ValidationError as err:
        raise HTTPException(status_code=422, detail=err.errors())
    probe = SMTPProbe(timeout=payload.timeout)
    start_ts = asyncio.get_event_loop().time()
    try:
        rt = await probe.check(
            payload.host, payload.port, payload.email, payload.password
        )
        await log_check_result(
            db,
            check_type="smtp",
            input_params=payload.model_dump(),
            status="success",
            response={"response_time": rt},
            duration=asyncio.get_event_loop().time() - start_ts,
        )
        return SMTPCheckResponse(success=True, response_time=rt)
    except SMTPProbeError as exc:
        await log_check_result(
            db,
            check_type="smtp",
            input_params=payload.model_dump(),
            status="error",
            response={"error_code": exc.code.value},
            error=exc.detail,
            duration=asyncio.get_event_loop().time() - start_ts,
        )
        status_code = status.HTTP_400_BAD_REQUEST
        if exc.code == ErrorCode.AUTH_FAILED:
            status_code = status.HTTP_401_UNAUTHORIZED
        elif exc.code in {ErrorCode.TIMEOUT, ErrorCode.CONNECTION_FAILED}:
            status_code = status.HTTP_504_GATEWAY_TIMEOUT
        raise HTTPException(
            status_code=status_code,
            detail={"error_code": exc.code.value, "detail": exc.detail},
        )
    except Exception as exc:
        await log_check_result(
            db,
            check_type="smtp",
            input_params=payload.model_dump(),
            status="error",
            response={"error": str(exc)},
            duration=asyncio.get_event_loop().time() - start_ts,
        )
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/config", response_model=list[SMTPImportResponse])
async def import_smtp_config(request: Request):
    try:
        data = await request.json()
    except JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    try:
        payload = SMTPImportRequest(**data)
    except ValidationError as err:
        raise HTTPException(status_code=422, detail=err.errors())
    service = SMTPDiscoveryService()
    lines = payload.data.splitlines()
    results = await service.import_from_lines(lines)
    return [
        SMTPImportResponse(email=e, server=h, port=p, security=s)
        for e, h, p, s in results
    ]


@router.patch("/{check_id}/status", response_model=CheckResultRead)
async def update_smtp_check_status(
    check_id: UUID, request: Request, session=Depends(get_db)
):
    try:
        data = await request.json()
    except JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    try:
        payload = CheckResultUpdate(**data)
    except ValidationError as err:
        raise HTTPException(status_code=422, detail=err.errors())
    result = await session.execute(
        select(CheckResult).where(CheckResult.id == check_id)
    )
    check = result.scalar_one_or_none()
    if not check:
        raise HTTPException(status_code=404, detail="Check result not found")
    check.status = payload.status
    session.add(check)
    await session.commit()
    await session.refresh(check)
    return CheckResultRead.model_validate(check)


@router.post("/handshake-test/{handshake_id}")
async def smtp_handshake_test(
    handshake_id: UUID, session=Depends(get_db)
) -> dict:
    """Execute saved handshake config."""
    try:
        cfg = handshake_service.get(handshake_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Handshake not found")
    start = asyncio.get_event_loop().time()
    try:
        code, resp = await handshake_service.test_smtp(cfg)
        await log_check_result(
            session,
            check_type="smtp",
            input_params={"handshake_id": str(handshake_id)},
            status="success" if 200 <= code < 400 else "error",
            response={"code": code, "response": resp},
            duration=asyncio.get_event_loop().time() - start,
        )
        return {"code": code, "response": resp, "success": 200 <= code < 400}
    except Exception as exc:
        await log_check_result(
            session,
            check_type="smtp",
            input_params={"handshake_id": str(handshake_id)},
            status="error",
            response={"error": str(exc)},
            duration=asyncio.get_event_loop().time() - start,
        )
        raise HTTPException(status_code=400, detail=str(exc))


tester = SMTPTester()


@router.post("/test", response_model=SMTPCredResult)
async def smtp_test_single(request: Request, session=Depends(get_db)):
    """Test SMTP credentials."""
    try:
        data = await request.json()
    except JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    raw_accounts: list[dict] | list[Any] | dict | Any
    if isinstance(data, dict) and "smtp_accounts" in data:
        raw_accounts = data.get("smtp_accounts")
    else:
        raw_accounts = data
    if not isinstance(raw_accounts, list):
        raw_accounts = [raw_accounts]

    try:
        accounts = [SMTPCred(**acct) for acct in raw_accounts]
    except ValidationError as err:
        raise HTTPException(status_code=422, detail=err.errors())
    payload = accounts[0]
    if settings.SMTP_PROXY_FORCE:
        proxy_service = ProxyService(session)
        proxies = await proxy_service.get_working_proxies("default")
        if not proxies:
            raise HTTPException(
                status_code=400, detail="No valid proxy configured"
            )
    result = await tester.test(
        payload.host, payload.port, payload.user, payload.pass_, payload.mode
    )
    return JSONResponse(content=result)


@router.post("/test/bulk", response_model=SMTPCredBulkResponse)
async def smtp_test_bulk(request: Request, session=Depends(get_db)):
    """Test multiple SMTP credentials in parallel."""
    try:
        data = await request.json()
    except JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    raw_accounts: list[dict] | list[Any] | dict | Any
    if isinstance(data, dict) and "smtp_accounts" in data:
        raw_accounts = data.get("smtp_accounts")
    else:
        raw_accounts = data
    if not isinstance(raw_accounts, list):
        raw_accounts = [raw_accounts]

    try:
        payload = [SMTPCred(**p) for p in raw_accounts]
    except ValidationError as err:
        raise HTTPException(status_code=422, detail=err.errors())
    if settings.SMTP_PROXY_FORCE:
        proxy_service = ProxyService(session)
        proxies = await proxy_service.get_working_proxies("default")
        if not proxies:
            raise HTTPException(
                status_code=400, detail="No valid proxy configured"
            )
    items = [p.model_dump(by_alias=True) for p in payload]
    results = await tester.test_bulk(items)
    return JSONResponse(content={"results": results})


@router.post("/checks", response_model=list[BulkCheckResult])
async def smtp_check_all(
    request: Request, cancel_token: str | None = Query(None)
) -> list[BulkCheckResult]:
    try:
        data = await request.json()
    except JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    try:
        payload = BulkCheckRequest(**data)
    except ValidationError as err:
        raise HTTPException(status_code=422, detail=err.errors())
    probe = SMTPProbe(timeout=payload.timeout)
    funcs = [
        lambda h=host: probe.check(
            h, payload.port, payload.username, payload.password
        )
        for host in payload.hosts
    ]
    token = cancel_token or "default"
    results = await global_thread_pool.run_tasks(token, funcs)
    resp: list[BulkCheckResult] = []
    for host, res in zip(payload.hosts, results, strict=False):
        if isinstance(res, SMTPProbeResult):
            resp.append(
                BulkCheckResult(
                    host=host,
                    success=res.success,
                    last_response=res.latency,
                    last_error=res.error_message,
                )
            )
        else:
            resp.append(
                BulkCheckResult(
                    host=host,
                    success=False,
                    last_response=None,
                    last_error=str(res),
                )
            )
    return resp
