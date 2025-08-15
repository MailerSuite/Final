import asyncio
import uuid
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

import aiosmtplib
from aiosmtplib import SMTPException
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Body,
    Depends,
    File,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from fastapi import Response
from sqlalchemy import and_, func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import settings
from core.database import get_db
from core.logger import get_logger
from models import Session as SessionModel
from models import SMTPAccount as SMTPAccountModel
from pydantic import BaseModel
from routers.auth import get_current_user
from schemas.common import MessageResponse, SuccessResponse
from schemas.smtp import (
    SMTPAccount,
    SMTPAccountCreate,
    SMTPAccountUpdate,
    SMTPBulkTestResponse,
    SMTPBulkUpload,
    SMTPCustomHandshakeResponse,
    SMTPStatus,
    SMTPTestRequest,
    SMTPTestResult,
)
from utils.geo_utils import lookup_country
from utils.uuid_utils import stringify_uuids

logger = get_logger(__name__)
router = APIRouter(tags=["SMTP"])
class SmtpThreadPoolUpdate(BaseModel):
    thread_pool_id: str

@router.post("/{session_id}/accounts/{account_id}/thread-pool")
async def set_smtp_account_thread_pool(
    session_id: str,
    account_id: str,
    payload: SmtpThreadPoolUpdate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Persist default thread_pool_id on an SMTP account."""
    await verify_session_access(session_id, current_user.id, db)
    res = await db.execute(
        select(SMTPAccountModel).where(
            SMTPAccountModel.id == account_id, SMTPAccountModel.session_id == session_id
        )
    )
    account = res.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="SMTP account not found")
    setattr(account, "thread_pool_id", payload.thread_pool_id)
    await db.commit()
    return {"message": "SMTP account thread pool updated", "account_id": account_id, "thread_pool_id": payload.thread_pool_id}



@router.get("/")
async def smtp_info() -> dict[str, Any]:
    """SMTP API information."""
    return {
        "service": "SMTP API",
        "version": "1.0.0",
        "description": "SMTP server configuration and testing",
        "endpoints": {
            "accounts": "/{session_id}/accounts",
            "bulk_upload": "/{session_id}/bulk-upload",
            "check": "/{session_id}/check",
            "test": "/test",
            "status": "/status",
        },
    }


def _normalize_smtp_account(account_row) -> SMTPAccount:
    try:
        data = stringify_uuids(dict(account_row))
        data["id"] = str(data["id"])
        data["session_id"] = str(data["session_id"])
        if data.get("last_checked"):
            data["last_checked"] = data["last_checked"].isoformat()
        if data.get("created_at"):
            data["created_at"] = data["created_at"].isoformat()
        return SMTPAccount(**data)
    except Exception as e:
        logger.error(f"Error normalizing SMTP account: {e}")
        logger.error(f"Account row: {account_row}")
        raise HTTPException(
            status_code=500, detail="Error processing account data"
        )


async def verify_session_access(
    session_id: str, user_id: str, db: AsyncSession
):
    try:
        result = await db.execute(
            select(SessionModel).where(
                and_(
                    SessionModel.id == session_id,
                    SessionModel.user_id == user_id,
                )
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Session not found or access denied",
            )
    except Exception as e:
        logger.error(f"Database error in verify_session_access: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error",
        )


@router.post("/{session_id}/accounts", response_model=SMTPAccount)
async def create_smtp_account(
    session_id: str,
    smtp: SMTPAccountCreate,
    background_tasks: BackgroundTasks,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        await verify_session_access(session_id, current_user.id, db)
        account_id = str(uuid.uuid4())

        server = smtp.server or ""
        country = await lookup_country(server) if server else None

        account = await db.execute(
            text("""
                INSERT INTO smtp_accounts (id, session_id, smtp_server, smtp_port, email, password, country)
                VALUES (:account_id, :session_id, :server, :port, :email, :password, :country)
                RETURNING id, session_id, smtp_server AS server, smtp_port AS port,
                          email, password, country, status, last_checked, response_time, error_message, created_at
            """),
            {
                "account_id": account_id,
                "session_id": session_id,
                "server": smtp.server,
                "port": smtp.port,
                "email": smtp.email,
                "password": smtp.password,
                "country": country,
            },
        )
        account_row = account.scalar_one()
        background_tasks.add_task(test_and_update_single_smtp, account_id, db)
        return _normalize_smtp_account(account_row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating SMTP account: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create SMTP account",
        )


@router.post("/{session_id}/bulk-upload", response_model=MessageResponse)
async def bulk_upload_smtp(
    session_id: str,
    upload: SMTPBulkUpload,
    background_tasks: BackgroundTasks,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        await verify_session_access(session_id, current_user.id, db)
        accounts = parse_smtp_data(upload.data)
        if not accounts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid SMTP accounts found in the data",
            )

        values = []
        account_ids = []
        for account in accounts:
            account_id = str(uuid.uuid4())
            account_ids.append(account_id)
            values.extend(
                [
                    account_id,
                    session_id,
                    account["server"],
                    account["port"],
                    account["email"],
                    account["password"],
                ]
            )
        placeholders = []
        for i in range(0, len(values), 6):
            placeholders.append(
                f"(${i + 1}, ${i + 2}, ${i + 3}, ${i + 4}, ${i + 5}, ${i + 6})"
            )
        query = f"\n        INSERT INTO smtp_accounts (id, session_id, smtp_server, smtp_port, email, password)\n        VALUES {', '.join(placeholders)}\n    "
        await db.execute(query, *values)
        for acc_id in account_ids:
            background_tasks.add_task(test_and_update_single_smtp, acc_id, db)
        return MessageResponse(
            message=f"Successfully uploaded {len(accounts)} SMTP accounts"
        )
    except HTTPException:
        raise
    except ValidationError as e:
        logger.error(f"Validation error in bulk upload: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid data format",
        )
    except Exception as e:
        logger.error(f"Error in bulk upload: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Bulk upload failed",
        )


@router.get("/{session_id}/accounts", response_model=list[SMTPAccount])
async def list_smtp_accounts(
    session_id: str,
    status_filter: str | None = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        await verify_session_access(session_id, current_user.id, db)
        query = "SELECT id, session_id, smtp_server AS server, smtp_port AS port, email, password, status, last_checked, response_time, error_message, created_at FROM smtp_accounts WHERE session_id = $1"
        params = [session_id]
        if status_filter:
            query += " AND status = $2"
            params.append(status_filter)
            idx = 3
        else:
            idx = 2
        query += f" ORDER BY created_at DESC LIMIT ${idx} OFFSET ${idx + 1}"
        accounts = await db.execute(query, *params, limit, offset)
        return [_normalize_smtp_account(account) for account in accounts]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing SMTP accounts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list SMTP accounts",
        )


@router.put("/{session_id}/accounts/{account_id}", response_model=SMTPAccount)
async def update_smtp_account(
    session_id: str,
    account_id: str,
    smtp: SMTPAccountUpdate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update existing SMTP account."""
    await verify_session_access(session_id, current_user.id, db)
    fields = []
    values = []
    if smtp.server is not None:
        fields.append(f"smtp_server = ${len(values) + 1}")
        values.append(smtp.server)
    if smtp.port is not None:
        fields.append(f"smtp_port = ${len(values) + 1}")
        values.append(smtp.port)
    if smtp.email is not None:
        fields.append(f"email = ${len(values) + 1}")
        values.append(smtp.email)
    if smtp.password is not None:
        fields.append(f"password = ${len(values) + 1}")
        values.append(smtp.password)
    if smtp.status is not None:
        fields.append(f"status = ${len(values) + 1}")
        values.append(
            smtp.status.value
            if isinstance(smtp.status, SMTPStatus)
            else smtp.status
        )
    if smtp.last_checked is not None:
        fields.append(f"last_checked = ${len(values) + 1}")
        values.append(to_naive_utc(smtp.last_checked))
    if smtp.response_time is not None:
        fields.append(f"response_time = ${len(values) + 1}")
        values.append(smtp.response_time)
    if smtp.error_message is not None:
        fields.append(f"error_message = ${len(values) + 1}")
        values.append(smtp.error_message)
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    values.extend([account_id, session_id])
    query = f"\n        UPDATE smtp_accounts\n        SET {', '.join(fields)}\n        WHERE id = ${len(values) - 1} AND session_id = ${len(values)}\n        RETURNING id, session_id, smtp_server AS server, smtp_port AS port,\n                  email, password, status, last_checked, response_time, error_message, created_at\n    "
    account = await db.execute(query, *values)
    account_row = account.scalar_one()
    if not account_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SMTP account not found",
        )
    return _normalize_smtp_account(account_row)


@router.delete(
    "/{session_id}/accounts/{account_id}", response_model=MessageResponse
)
async def delete_smtp_account(
    session_id: str,
    account_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    await verify_session_access(session_id, current_user.id, db)
    result = await db.execute(
        "DELETE FROM smtp_accounts WHERE id = $1 AND session_id = $2",
        account_id,
        session_id,
    )
    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SMTP account not found",
        )
    return MessageResponse(message="SMTP account deleted successfully")


@router.delete(
    "/{session_id}/configurations",
    response_model=MessageResponse,
    summary="Bulk delete SMTP account configurations",
)
async def delete_smtp_configurations(
    session_id: str,
    payload: dict = Body(...),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    ids: list[UUID] = payload.get("ids", [])
    await verify_session_access(session_id, current_user.id, db)
    result = await db.execute(
        "DELETE FROM smtp_accounts WHERE id = ANY($1::uuid[]) AND session_id = $2",
        ids,
        session_id,
    )
    deleted_count = result.rowcount
    return MessageResponse(
        message=f"Deleted {deleted_count} SMTP configurations"
    )


async def test_smtp_connection(
    account_data: dict, proxy_data: dict = None, timeout: int = 30
):
    """Test SMTP connection"""
    start_time = time.time()
    try:
        if proxy_data:
            pass
        smtp = aiosmtplib.SMTP(
            hostname=account_data["server"],
            port=account_data["port"],
            timeout=timeout,
            use_tls=False,  # Start without TLS
        )
        await smtp.connect()

        # Check if STARTTLS is needed
        if account_data["port"] in [587, 25]:
            try:
                await smtp.starttls()
            except Exception as tls_error:
                # If STARTTLS failed, check other options
                if "Connection already using TLS" in str(tls_error):
                    # Try SSL port
                    await smtp.quit()
                    ssl_port = (
                        465
                        if account_data["server"]
                        in ["smtp.gmail.com", "smtp-mail.outlook.com"]
                        else account_data["port"]
                    )
                    smtp_ssl = aiosmtplib.SMTP(
                        hostname=account_data["server"],
                        port=ssl_port,
                        timeout=timeout,
                        use_tls=True,  # Direct SSL connection
                    )
                    await smtp_ssl.connect()
                    await smtp_ssl.login(
                        account_data["email"], account_data["password"]
                    )
                    await smtp_ssl.quit()
                    return {
                        "status": "success",
                        "message": f"SSL connection successful on port {ssl_port}",
                        "response_time": time.time() - start_time,
                    }
                else:
                    raise tls_error

        await smtp.login(account_data["email"], account_data["password"])
        await smtp.quit()
        return {
            "status": "success",
            "message": "Connection successful",
            "response_time": time.time() - start_time,
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "response_time": time.time() - start_time,
        }


async def test_and_update_single_smtp(
    account_id: str, db: AsyncSession
) -> None:
    """Run SMTP test for the given account and update its status."""
    account = await db.execute(
        select(SMTPAccountModel).where(SMTPAccountModel.id == account_id)
    )
    account_row = account.scalar_one_or_none()
    if not account_row:
        return
    result = await test_smtp_connection(dict(account_row))
    if result["status"] == "success":
        status = SMTPStatus.VALID.value
    elif result["status"] == "invalid":
        status = SMTPStatus.INVALID.value
    else:
        status = SMTPStatus.ERROR.value
    country = await lookup_country(account_row.server)
    await db.execute(
        update(SMTPAccountModel)
        .where(SMTPAccountModel.id == account_id)
        .values(
            status=status,
            last_checked=datetime.now(UTC),
            response_time=result.get("response_time"),
            error_message=None
            if result["status"] == "success"
            else result["message"],
            country=country,
        )
    )
    await log_check_result(
        db,
        check_type="smtp",
        input_params={
            "email": account_row.email,
            "server": account_row.server,
            "port": account_row.port,
        },
        status=result["status"],
        response={
            "message": result["message"],
            "response_time": result.get("response_time"),
        },
        session_id=account_row.session_id,
    )


@router.post("/{session_id}/check", response_model=MessageResponse)
async def check_smtp_accounts(
    session_id: str,
    background_tasks: BackgroundTasks,
    account_ids: list[str] = Body(None),
    smtp_account_ids: list[str] = Body(None, alias="smtp_account_ids"),
    proxy_ids: list[str] = Body(None),
    timeout: int = Body(30),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
    response: Response = None,
):
    await verify_session_access(session_id, current_user.id, db)
    # Hint clients about unified testers for ad-hoc checks
    if response is not None:
        response.headers["Link"] = "</api/v1/smtp/test>; rel=alternate, </api/v1/smtp/test-file>; rel=alternate, </api/v1/smtp/test-batch>; rel=alternate"
        response.headers["Deprecation"] = "true"
    ids_to_check: list[str] = []
    if account_ids:
        ids_to_check.extend(account_ids)
    if smtp_account_ids:
        ids_to_check.extend(smtp_account_ids)
    base_select = "SELECT id, session_id, smtp_server AS server, smtp_port AS port, email, password, status, last_checked, response_time, error_message, created_at FROM smtp_accounts "
    if ids_to_check:
        query = base_select + "WHERE id = ANY($1) AND session_id = $2"
        accounts = await db.execute(query, ids_to_check, session_id)
    else:
        query = base_select + "WHERE session_id = $1 AND status = 'none'"
        accounts = await db.execute(query, session_id)
    proxies = []
    if proxy_ids:
        proxies = await db.execute(
            "SELECT * FROM proxy_servers WHERE id = ANY($1) AND session_id = $2",
            proxy_ids,
            session_id,
        )
    background_tasks.add_task(
        check_smtp_accounts_background,
        accounts,
        proxies,
        timeout,
        session_id,
        db,
    )
    return MessageResponse(
        message=f"Started checking {accounts.rowcount} SMTP accounts"
    )


async def check_smtp_accounts_background(
    accounts: list[dict],
    proxies: list[dict],
    timeout: int,
    session_id: str,
    db: AsyncSession,
):
    """Background task to check SMTP accounts"""
    total = len(accounts)
    checked = 0
    valid = 0
    invalid = 0
    semaphore = asyncio.Semaphore(10)

    async def check_single_account(account):
        nonlocal checked, valid, invalid
        async with semaphore:
            proxy = None
            if proxies:
                import random

                proxy = random.choice(proxies)
            result = await test_smtp_connection(
                dict(account), dict(proxy) if proxy else None, timeout
            )
            if result["status"] == "success":
                status = SMTPStatus.VALID.value
            elif result["status"] == "invalid":
                status = SMTPStatus.INVALID.value
            else:
                status = SMTPStatus.ERROR.value
            await db.execute(
                update(SMTPAccountModel)
                .where(SMTPAccountModel.id == account["id"])
                .values(
                    status=status,
                    last_checked=datetime.now(UTC),
                    response_time=result.get("response_time"),
                    error_message=None
                    if result["status"] == "success"
                    else result["message"],
                )
            )
            await log_check_result(
                db,
                check_type="smtp",
                input_params={
                    "email": account["email"],
                    "server": account.get("server"),
                    "port": account.get("port"),
                },
                status=result["status"],
                response={
                    "message": result["message"],
                    "response_time": result.get("response_time"),
                },
                session_id=session_id,
            )
            await send_job_log_update(
                session_id,
                {
                    "account_id": account["id"],
                    "status": result["status"],
                    "message": result["message"],
                    "response_time": result.get("response_time"),
                },
            )
            checked += 1
            if result["status"] == "success":
                valid += 1
            else:
                invalid += 1
            logger.info(
                f"SMTP check progress: {checked}/{total} - Valid: {valid}, Invalid: {invalid}"
            )

    tasks = [check_single_account(account) for account in accounts]
    await asyncio.gather(*tasks, return_exceptions=True)
    logger.info(
        f"SMTP check completed: {valid} valid, {invalid} invalid out of {total} total"
    )


@router.get("/{session_id}/check-progress")
async def get_check_progress(
    session_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    await verify_session_access(session_id, current_user.id, db)
    total = await db.execute(
        select(func.count())
        .select_from(SMTPAccountModel)
        .where(SMTPAccountModel.session_id == session_id)
    )
    total_count = total.scalar_one()
    valid_count = await db.execute(
        select(func.count())
        .select_from(SMTPAccountModel)
        .where(
            and_(
                SMTPAccountModel.session_id == session_id,
                SMTPAccountModel.status == SMTPStatus.VALID.value,
            )
        )
    )
    valid_count = valid_count.scalar_one()
    invalid_count = await db.execute(
        select(func.count())
        .select_from(SMTPAccountModel)
        .where(
            and_(
                SMTPAccountModel.session_id == session_id,
                SMTPAccountModel.status == SMTPStatus.INVALID.value,
            )
        )
    )
    invalid_count = invalid_count.scalar_one()
    progress = (
        int(((valid_count + invalid_count) / total_count) * 100)
        if total_count > 0
        else 0
    )
    return CheckProgress(
        checked=valid_count,
        failed=invalid_count,
        progress=progress,
        total=total_count,
    )


@router.post("/test")
async def test_smtp_accounts(request: Request):
    """Test a single SMTP account and return structured result."""
    try:
        data = await request.json()
    except JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    try:
        req = SMTPTestRequest(**data)
    except ValidationError as err:
        raise HTTPException(status_code=422, detail=err.errors())
    start_time = time.time()
    try:
        account = {
            "server": req.server,
            "port": req.port,
            "email": req.email,
            "password": req.password,
        }
        result = await test_smtp_connection(account, timeout=req.timeout)
        status = (
            SMTPStatus.VALID
            if result["status"] == "success"
            else SMTPStatus.INVALID
        )
        return {
            "results": [
                SMTPTestResult(
                    email=req.email,
                    status=status,
                    response_time=result.get("response_time"),
                    error_message=(
                        None
                        if status == SMTPStatus.VALID
                        else result.get("message")
                    ),
                )
            ]
        }
    except SMTPException as exc:
        response_time = time.time() - start_time
        return {
            "results": [
                SMTPTestResult(
                    email=req.email,
                    status=SMTPStatus.INVALID,
                    response_time=response_time,
                    error_message=str(exc),
                )
            ]
        }
    except Exception as exc:
        response_time = time.time() - start_time
        return {
            "results": [
                SMTPTestResult(
                    email=req.email,
                    status=SMTPStatus.INVALID,
                    response_time=response_time,
                    error_message=str(exc),
                )
            ]
        }


class SMTPBatchAccount(BaseModel):
    server: str
    port: int
    email: str
    password: str
    timeout: int | None = 30


class SMTPBatchTestRequest(BaseModel):
    accounts: list[SMTPBatchAccount]
    timeout: int | None = 30
    max_concurrent: int | None = 20


@router.post("/test-batch", response_model=SMTPBulkTestResponse)
async def test_smtp_accounts_batch(payload: SMTPBatchTestRequest):
    """Batch test SMTP accounts via JSON payload (unified endpoint).

    Accepts a list of accounts and runs tests concurrently with a semaphore.
    """
    if not payload.accounts:
        raise HTTPException(status_code=422, detail="accounts is required")

    semaphore = asyncio.Semaphore(payload.max_concurrent or 20)
    results: list[SMTPTestResult] = []

    async def _check(acc: SMTPBatchAccount):
        async with semaphore:
            acc_dict = {
                "server": acc.server,
                "port": acc.port,
                "email": acc.email,
                "password": acc.password,
            }
            r = await test_smtp_connection(acc_dict, timeout=acc.timeout or payload.timeout or 30)
            status = SMTPStatus.VALID if r.get("status") == "success" else SMTPStatus.INVALID
            results.append(
                SMTPTestResult(
                    email=acc.email,
                    status=status,
                    response_time=r.get("response_time"),
                    error_message=None if status == SMTPStatus.VALID else r.get("message"),
                )
            )

    await asyncio.gather(*[_check(a) for a in payload.accounts])

    valid = sum(1 for r in results if r.status == SMTPStatus.VALID)
    invalid = sum(1 for r in results if r.status == SMTPStatus.INVALID)
    errors = 0  # Errors are counted as invalid here; adjust if separate state desired
    return SMTPBulkTestResponse(total=len(results), valid=valid, invalid=invalid, errors=errors, results=results)


@router.post("/start", response_model=MessageResponse)
async def start_smtp_test(request: Request):
    """Start SMTP handshake testing."""
    try:
        data = await request.json()
    except JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    try:
        cfg = SMTPTestConfig(**data)
    except ValidationError as err:
        raise HTTPException(status_code=422, detail=err.errors())
    try:
        await smtp_test_service.start(cfg.server, cfg.port)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return MessageResponse(message="started")


@router.post("/stop", response_model=MessageResponse)
async def stop_smtp_test():
    """Stop current SMTP test if running."""
    if smtp_test_service.metrics.state != SMTPTestState.RUNNING:
        return MessageResponse(message="not running")
    await smtp_test_service.stop()
    return MessageResponse(
        message="stopped",
        data={"reason": smtp_test_service.metrics.stop_reason},
    )


@router.get("/status")
async def smtp_test_status():
    """Return current SMTP test metrics."""
    return smtp_test_service.status()


@router.post("/test-file", response_model=SMTPBulkTestResponse)
async def test_smtp_accounts_from_file(
    smtp_file: UploadFile = File(...),
    timeout: int = 30,
    max_concurrent: int = settings.SMTP_MAX_CONCURRENT,
    thread_pool_id: str | None = None,
):
    """Test SMTP accounts from uploaded file"""
    try:
        content = await smtp_file.read()
        content_str = content.decode("utf-8")
        smtp_accounts = parse_smtp_list(content_str)
        if not smtp_accounts:
            raise HTTPException(
                status_code=400, detail="No valid SMTP accounts found in file"
            )
        checker = SMTPChecker(timeout=timeout)
        results = await checker.check_multiple_accounts(
            smtp_accounts,
            max_concurrent=max_concurrent,
            thread_pool_id=thread_pool_id,
        )
        valid = sum(1 for r in results if r.status == SMTPStatus.VALID)
        invalid = sum(1 for r in results if r.status == SMTPStatus.INVALID)
        errors = sum(1 for r in results if r.status == SMTPStatus.ERROR)
        return SMTPBulkTestResponse(
            total=len(results),
            valid=valid,
            invalid=invalid,
            errors=errors,
            results=results,
        )
    except Exception as e:
        logger.error(f"SMTP file test error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parse", response_model=SuccessResponse)
async def parse_smtp_list_endpoint(smtp_file: UploadFile = File(...)):
    """Parse SMTP list from file and return parsed accounts"""
    try:
        content = await smtp_file.read()
        content_str = content.decode("utf-8")
        smtp_accounts = parse_smtp_list(content_str)
        return SuccessResponse(
            success=True,
            message=f"Parsed {len(smtp_accounts)} SMTP accounts",
            data={
                "accounts": [account.dict() for account in smtp_accounts],
                "count": len(smtp_accounts),
            },
        )
    except Exception as e:
        logger.error(f"SMTP parse error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/custom-handshake", response_model=SMTPCustomHandshakeResponse)
async def smtp_custom_handshake(request: Request):
    """Execute a custom SMTP handshake command."""
    try:
        data = await request.json()
    except JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    try:
        payload = SMTPCustomHandshake(**data)
    except ValidationError as err:
        raise HTTPException(status_code=422, detail=err.errors())
    host = payload.hostname
    port = 25
    if ":" in host:
        host, port_str = host.rsplit(":", 1)
        try:
            port = int(port_str)
        except ValueError:
            raise HTTPException(status_code=400, detail="invalid hostname")
    try:
        smtp = aiosmtplib.SMTP(
            hostname=host, port=port, timeout=payload.timeout / 1000
        )
        await smtp.connect()
        code, message = await smtp.execute_command(payload.message.encode())
        await smtp.quit()
        return {"code": code, "response": message}
    except Exception as exc:
        logger.error(f"Custom handshake failed: {exc}")
        raise HTTPException(status_code=400, detail=str(exc))
