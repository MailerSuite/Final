import asyncio
import time
import uuid
from datetime import datetime
from typing import Any

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from fastapi import Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import settings
from core.database import get_db
from core.imap_checker import IMAPChecker, parse_imap_list
from core.logger import get_logger
from routers.auth import get_current_user
from schemas.common import MessageResponse, SuccessResponse
from schemas.imap import (
    FolderListResponse,
    IMAPAccountCreate,
    IMAPAccountResponse,
    IMAPAccountUpdate,
    IMAPBulkTestResponse,
    IMAPTestResult,
    IMAPSendTestEmailRequest,
    IMAPStatus,
    IMAPTestConfig,
    IMAPTestRequest,
)
from services.imap_service import IMAPService
from services.imap_test_service import IMAPTestState, imap_test_service
from tasks import imap_tasks
from utils.check_logging import log_check_result
from utils.datetime_utils import to_naive_utc
from utils.imap_utils import get_imap_server_and_port
from utils.uuid_utils import stringify_uuids

router = APIRouter()
class ImapThreadPoolUpdate(BaseModel):
    thread_pool_id: str

@router.post("/{session_id}/accounts/{account_id}/thread-pool")
async def set_imap_account_thread_pool(
    session_id: str,
    account_id: str,
    payload: ImapThreadPoolUpdate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    await verify_session_access(session_id, current_user.id, db)
    res = await db.execute(
        "SELECT id FROM imap_accounts WHERE id = $1 AND session_id = $2",
        account_id,
        session_id,
    )
    if not res:
        raise HTTPException(status_code=404, detail="IMAP account not found")
    await db.execute(
        "UPDATE imap_accounts SET thread_pool_id = $1 WHERE id = $2 AND session_id = $3",
        payload.thread_pool_id,
        account_id,
        session_id,
    )
    await db.commit()
    return {"message": "IMAP account thread pool updated", "account_id": account_id, "thread_pool_id": payload.thread_pool_id}

logger = get_logger(__name__)


def _normalize_imap_account(account_row: Any) -> IMAPAccountResponse:
    """Convert DB record to :class:`IMAPAccountResponse` with sane defaults."""
    data = stringify_uuids(dict(account_row))
    if "imap_server" in data:
        data["server"] = data.pop("imap_server")
    data.setdefault("server", None)
    if "imap_port" in data:
        data["port"] = data.pop("imap_port")
    data.setdefault("port", None)
    if (data.get("server") is None or data.get("port") is None) and data.get(
        "email"
    ):
        guessed = get_imap_server_and_port(data["email"])
        data["server"] = data.get("server") or guessed[0]
        data["port"] = data.get("port") or guessed[1]
    if "last_checked" in data:
        data["last_check"] = data.pop("last_checked")
    data.setdefault("last_check", None)
    if "response_time" not in data:
        data["response_time"] = None
    if data.get("status") is None:
        data["status"] = IMAPStatus.PENDING
    else:
        try:
            data["status"] = IMAPStatus(data["status"])
        except ValueError:
            numeric_map = {
                "0": IMAPStatus.PENDING,
                "1": IMAPStatus.VALID,
                "2": IMAPStatus.INVALID,
                "3": IMAPStatus.ERROR,
                "4": IMAPStatus.DEAD,
                "5": IMAPStatus.CHECKED,
            }
            raw_status = str(data["status"]).split(".")[-1]
            data["status"] = numeric_map.get(raw_status, IMAPStatus.PENDING)
    if data.get("created_at") is None:
        data["created_at"] = datetime.utcnow()
    if data.get("inbox_count") is None:
        data["inbox_count"] = 0
    return IMAPAccountResponse(**data)


async def verify_session_access(
    session_id: str, user_id: str, db: AsyncSession
):
    try:
        session = result = await db.execute(
            "SELECT id FROM sessions WHERE id = $1 AND user_id = $2",
            session_id,
            user_id,
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session id")
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied",
        )


@router.post("/{session_id}/accounts", response_model=IMAPAccountResponse)
async def create_imap_account(
    session_id: str,
    imap: IMAPAccountCreate,
    background_tasks: BackgroundTasks,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    await verify_session_access(session_id, current_user.id, db)
    account_id = str(uuid.uuid4())
    account = result = await db.execute(
        "INSERT INTO imap_accounts (id, session_id, imap_server, imap_port, email, password)\n           VALUES ($1, $2, $3, $4, $5, $6)\n           RETURNING id, session_id, imap_server, imap_port, email, password, status,\n                     last_checked, response_time, error_message, created_at",
        account_id,
        session_id,
        imap.server,
        imap.port,
        imap.email,
        imap.password,
    )
    background_tasks.add_task(test_and_update_single_imap, account_id, db)
    return _normalize_imap_account(account)


@router.get("/{session_id}/accounts", response_model=list[IMAPAccountResponse])
async def list_imap_accounts(
    session_id: str,
    status_filter: str = None,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    await verify_session_access(session_id, current_user.id, db)
    query = "SELECT id, session_id, email, password, imap_server, imap_port, use_ssl, oauth_provider, access_token, refresh_token, token_expires_at, status, is_checked, last_checked, response_time, inbox_count, error_message, created_at FROM imap_accounts WHERE session_id = $1"
    params = [session_id]
    if status_filter:
        query += " AND status = $2"
        params.append(status_filter)
    query += " ORDER BY created_at DESC"
    try:
        accounts = result = await db.execute(query, *params)
        account_dicts = [dict(a) for a in accounts]
    except Exception:
        fallback_query = query.replace(", inbox_count", "")
        accounts = result = await db.execute(fallback_query, *params)
        account_dicts = [dict(a) | {"inbox_count": 0} for a in accounts]
    return [_normalize_imap_account(account) for account in account_dicts]


@router.get("/{session_id}/folders", response_model=FolderListResponse)
async def list_folders(session_id: str, db=Depends(get_db)):
    """List folders for an active IMAP session."""
    imap_service = IMAPService(db)
    folders = await imap_service.list_imap_folders(session_id)
    return {"folders": folders}


@router.put(
    "/{session_id}/accounts/{account_id}", response_model=IMAPAccountResponse
)
async def update_imap_account(
    session_id: str,
    account_id: str,
    imap: IMAPAccountUpdate,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update existing IMAP account."""
    await verify_session_access(session_id, current_user.id, db)
    fields = []
    values = []
    if imap.server is not None:
        fields.append(f"imap_server = ${len(values) + 1}")
        values.append(imap.server)
    if imap.port is not None:
        fields.append(f"imap_port = ${len(values) + 1}")
        values.append(imap.port)
    if imap.email is not None:
        fields.append(f"email = ${len(values) + 1}")
        values.append(imap.email)
    if imap.password is not None:
        fields.append(f"password = ${len(values) + 1}")
        values.append(imap.password)
    if imap.status is not None:
        fields.append(f"status = ${len(values) + 1}")
        values.append(
            imap.status.value
            if isinstance(imap.status, IMAPStatus)
            else imap.status
        )
    if imap.last_check is not None:
        fields.append(f"last_checked = ${len(values) + 1}")
        values.append(to_naive_utc(imap.last_check))
    if imap.error_message is not None:
        fields.append(f"error_message = ${len(values) + 1}")
        values.append(imap.error_message)
    if imap.response_time is not None:
        fields.append(f"response_time = ${len(values) + 1}")
        values.append(imap.response_time)
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    values.extend([account_id, session_id])
    query = f"\n        UPDATE imap_accounts\n        SET {', '.join(fields)}\n        WHERE id = ${len(values) - 1} AND session_id = ${len(values)}\n        RETURNING id, session_id, imap_server, imap_port, email, password, status,\n                  last_checked, response_time, inbox_count, error_message, created_at\n    "
    try:
        account = result = await db.execute(query, *values)
    except Exception:
        fallback_query = query.replace(", inbox_count", "")
        account = result = await db.execute(fallback_query, *values)
        if account:
            account = dict(account) | {"inbox_count": 0}
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IMAP account not found",
        )
    return _normalize_imap_account(account)


@router.delete(
    "/{session_id}/accounts/{account_id}", response_model=MessageResponse
)
async def delete_imap_account(
    session_id: str,
    account_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    await verify_session_access(session_id, current_user.id, db)
    await db.execute(
        "DELETE FROM imap_messages WHERE folder_id IN (SELECT id FROM imap_folders WHERE imap_account_id = $1)",
        account_id,
    )
    await db.execute(
        "DELETE FROM imap_folders WHERE imap_account_id = $1", account_id
    )
    result = await db.execute(
        "DELETE FROM imap_accounts WHERE id = $1 AND session_id = $2",
        account_id,
        session_id,
    )
    if result == "DELETE 0":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IMAP account not found",
        )
    return MessageResponse(message="IMAP account deleted successfully")


async def test_imap_connection(account_data: dict, timeout: int = 30) -> dict:
    """Test IMAP connection using the IMAPChecker service."""
    start_time = time.time()
    checker = IMAPChecker(timeout=timeout)
    account = IMAPAccountCreate(
        server=account_data.get("server") or account_data.get("imap_server"),
        port=account_data.get("port") or account_data.get("imap_port"),
        email=account_data["email"],
        password=account_data["password"],
    )
    try:
        result = await checker.check_imap_account(account)
    except Exception as exc:
        logger.error("IMAP check failed: %s", exc)
        return {
            "status": "error",
            "message": str(exc),
            "response_time": time.time() - start_time,
        }
    if result.status == IMAPStatus.VALID:
        return {
            "status": "success",
            "message": "Connection successful",
            "response_time": result.response_time or time.time() - start_time,
        }
    return {
        "status": "error",
        "message": result.error_message or "Unknown error",
        "response_time": result.response_time or time.time() - start_time,
    }


async def test_and_update_single_imap(
    account_id: str, db: AsyncSession
) -> None:
    """Run IMAP test for the given account and update its status."""
    account = result = await db.execute(
        "SELECT id, session_id, email, password, imap_server AS server, imap_port AS port FROM imap_accounts WHERE id = $1",
        account_id,
    )
    if not account:
        return
    result = await test_imap_connection(dict(account))
    status = "checked" if result["status"] == "success" else "dead"
    await db.execute(
        "UPDATE imap_accounts SET status = $1, last_checked = CURRENT_TIMESTAMP, response_time = $3, error_message = $4 WHERE id = $2",
        status,
        account_id,
        result.get("response_time"),
        None if result["status"] == "success" else result["message"],
    )
    await log_check_result(
        db,
        check_type="imap",
        input_params={
            "email": account["email"],
            "server": account.get("server"),
            "port": account.get("port"),
        },
        status="success" if result["status"] == "success" else "error",
        response={
            "message": result["message"],
            "response_time": result.get("response_time"),
        },
        session_id=account["session_id"],
    )


@router.post("/test", response_model=IMAPBulkTestResponse)
async def test_imap_accounts(
    request: IMAPTestRequest,
    max_concurrent: int = settings.IMAP_MAX_CONCURRENT,
    thread_pool_id: str | None = None,
) -> IMAPBulkTestResponse:
    """Test IMAP accounts"""
    checker = IMAPChecker(timeout=request.timeout)
    try:
        results = await checker.check_multiple_accounts(
            request.imap_accounts,
            max_concurrent=max_concurrent,
            thread_pool_id=thread_pool_id,
        )
        valid = sum(1 for r in results if r.status == IMAPStatus.VALID)
        invalid = sum(1 for r in results if r.status == IMAPStatus.INVALID)
        errors = sum(1 for r in results if r.status == IMAPStatus.ERROR)
        return IMAPBulkTestResponse(
            total=len(results),
            valid=valid,
            invalid=invalid,
            errors=errors,
            results=results,
        )
    except Exception as e:
        logger.error(f"IMAP test error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class IMAPBatchAccount(BaseModel):
    server: str
    port: int
    email: str
    password: str
    timeout: int | None = 30


class IMAPBatchTestRequest(BaseModel):
    accounts: list[IMAPBatchAccount]
    timeout: int | None = 30
    max_concurrent: int | None = 20


@router.post("/test-batch", response_model=IMAPBulkTestResponse)
async def test_imap_accounts_batch(payload: IMAPBatchTestRequest) -> IMAPBulkTestResponse:
    """Batch test IMAP accounts via JSON payload (unified endpoint)."""
    if not payload.accounts:
        raise HTTPException(status_code=422, detail="accounts is required")

    checker = IMAPChecker(timeout=payload.timeout or 30)
    sem = asyncio.Semaphore(payload.max_concurrent or 20)
    results: list[IMAPTestResult] = []

    async def _check(acc: IMAPBatchAccount):
        async with sem:
            req = IMAPAccountCreate(server=acc.server, port=acc.port, email=acc.email, password=acc.password)
            r = await checker.check_imap_account(req)
            results.append(r)

    await asyncio.gather(*[_check(a) for a in payload.accounts])

    valid = sum(1 for r in results if r.status == IMAPStatus.VALID)
    invalid = sum(1 for r in results if r.status == IMAPStatus.INVALID)
    errors = sum(1 for r in results if r.status == IMAPStatus.ERROR)
    return IMAPBulkTestResponse(total=len(results), valid=valid, invalid=invalid, errors=errors, results=results)


@router.post("/test-file", response_model=IMAPBulkTestResponse)
async def test_imap_accounts_from_file(
    imap_file: UploadFile = File(...),
    timeout: int = 30,
    max_concurrent: int = settings.IMAP_MAX_CONCURRENT,
    thread_pool_id: str | None = None,
) -> IMAPBulkTestResponse:
    """Test IMAP accounts from uploaded file"""
    try:
        content = await imap_file.read()
        content_str = content.decode("utf-8")
        imap_accounts = parse_imap_list(content_str)
        if not imap_accounts:
            raise HTTPException(
                status_code=400, detail="No valid IMAP accounts found in file"
            )
        checker = IMAPChecker(timeout=timeout)
        results = await checker.check_multiple_accounts(
            imap_accounts,
            max_concurrent=max_concurrent,
            thread_pool_id=thread_pool_id,
        )
        valid = sum(1 for r in results if r.status == IMAPStatus.VALID)
        invalid = sum(1 for r in results if r.status == IMAPStatus.INVALID)
        errors = sum(1 for r in results if r.status == IMAPStatus.ERROR)
        return IMAPBulkTestResponse(
            total=len(results),
            valid=valid,
            invalid=invalid,
            errors=errors,
            results=results,
        )
    except Exception as e:
        logger.error(f"IMAP file test error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parse", response_model=SuccessResponse)
async def parse_imap_list_endpoint(
    imap_file: UploadFile = File(...),
) -> SuccessResponse:
    """Parse IMAP list from file and return parsed accounts"""
    try:
        content = await imap_file.read()
        content_str = content.decode("utf-8")
        imap_accounts = parse_imap_list(content_str)
        return SuccessResponse(
            success=True,
            message=f"Parsed {len(imap_accounts)} IMAP accounts",
            data={
                "accounts": [account.dict() for account in imap_accounts],
                "count": len(imap_accounts),
            },
        )
    except Exception as e:
        logger.error(f"IMAP parse error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/check", response_model=MessageResponse)
async def check_imap_accounts(
    session_id: str,
    background_tasks: BackgroundTasks,
    account_ids: list[str] = None,
    timeout: int = 30,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
    response: Response = None,
):
    await verify_session_access(session_id, current_user.id, db)
    if response is not None:
        response.headers["Link"] = "</api/v1/imap/test>; rel=alternate, </api/v1/imap/test-file>; rel=alternate, </api/v1/imap/test-batch>; rel=alternate"
        response.headers["Deprecation"] = "true"
    if account_ids:
        accounts = result = await db.execute(
            "SELECT id, session_id, email, password, imap_server, imap_port, use_ssl, oauth_provider, access_token, refresh_token, token_expires_at, status, is_checked, last_checked, error_message, created_at FROM imap_accounts WHERE id = ANY($1) AND session_id = $2",
            account_ids,
            session_id,
        )
    else:
        accounts = result = await db.execute(
            "SELECT id, session_id, email, password, imap_server, imap_port, use_ssl, oauth_provider, access_token, refresh_token, token_expires_at, status, is_checked, last_checked, error_message, created_at FROM imap_accounts WHERE session_id = $1 AND status = 'none'",
            session_id,
        )
    background_tasks.add_task(
        check_imap_accounts_background, accounts, timeout, session_id, db
    )
    return MessageResponse(
        message=f"Started checking {len(accounts)} IMAP accounts"
    )


async def check_imap_accounts_background(
    accounts: list[dict], timeout: int, session_id: str, db: AsyncSession
):
    """Background task to check IMAP accounts"""
    total = len(accounts)
    checked = 0
    valid = 0
    invalid = 0
    checker = IMAPChecker(timeout=timeout)
    semaphore = asyncio.Semaphore(5)

    async def check_single_account(account):
        nonlocal checked, valid, invalid
        async with semaphore:
            start_ts = asyncio.get_event_loop().time()
            account_dict = dict(account)
            imap_account = IMAPAccountCreate(
                server=account_dict.get("imap_server"),
                port=account_dict.get("imap_port"),
                email=account_dict["email"],
                password=account_dict["password"],
            )
            result = await checker.check_imap_account(imap_account)
            status = "checked" if result.status == IMAPStatus.VALID else "dead"
            await db.execute(
                "UPDATE imap_accounts SET status = $1, last_checked = CURRENT_TIMESTAMP, response_time = $3 WHERE id = $2",
                status,
                account["id"],
                result.response_time,
            )
            await log_check_result(
                db,
                check_type="imap",
                input_params={
                    "email": account_dict["email"],
                    "server": account_dict.get("imap_server"),
                    "port": account_dict.get("imap_port"),
                },
                status="success"
                if result.status == IMAPStatus.VALID
                else "error",
                response={
                    "message": result.error_message or "Connection successful",
                    "inbox_count": result.inbox_count,
                },
                duration=asyncio.get_event_loop().time() - start_ts,
                session_id=session_id,
            )
            checked += 1
            if result.status == IMAPStatus.VALID:
                valid += 1
            else:
                invalid += 1
            logger.info(
                f"IMAP check progress: {checked}/{total} - Valid: {valid}, Invalid: {invalid}"
            )

    tasks = [check_single_account(account) for account in accounts]
    await asyncio.gather(*tasks, return_exceptions=True)
    logger.info(
        f"IMAP check completed: {valid} valid, {invalid} invalid out of {total} total"
    )


@router.post(
    "/{session_id}/bulk-upload-from-email", response_model=MessageResponse
)
async def bulk_upload_from_email(
    session_id: str,
    email_data: str,
    background_tasks: BackgroundTasks,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    await verify_session_access(session_id, current_user.id, db)
    accounts = []
    lines = email_data.strip().split("\n")
    for line in lines:
        line = line.strip()
        if ":" in line:
            parts = line.split(":", 1)
            if len(parts) == 2:
                email, password = parts
                server, port = get_imap_server_and_port(email)
                if server and port:
                    accounts.append(
                        {
                            "server": server,
                            "port": port,
                            "email": email,
                            "password": password,
                        }
                    )
    if not accounts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid email:password combinations found",
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
    query = f"\n        INSERT INTO imap_accounts (id, session_id, imap_server, imap_port, email, password)\n        VALUES {', '.join(placeholders)}\n    "
    await db.execute(query, *values)
    for acc_id in account_ids:
        background_tasks.add_task(test_and_update_single_imap, acc_id, db)
    return MessageResponse(
        message=f"Successfully uploaded {len(accounts)} IMAP accounts"
    )


@router.post("/send-test-email", status_code=status.HTTP_202_ACCEPTED)
async def send_test_email(
    payload: IMAPSendTestEmailRequest, db=Depends(get_db)
):
    if not payload.imap_account_id and (not payload.recipient_override):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="imap_account_id or recipient_override required",
        )
    account_id = payload.imap_account_id
    if account_id is None:
        account = result = await db.execute(
            "SELECT id FROM imap_accounts WHERE status='checked' ORDER BY RANDOM() LIMIT 1"
        )
        if not account:
            raise HTTPException(
                status_code=404, detail="No IMAP accounts available"
            )
        account_id = account["id"]
    job_id = uuid.uuid4()
    imap_tasks.send_test_email_bulk.delay(
        str(job_id),
        str(payload.template_id),
        str(account_id),
        payload.recipient_override,
        payload.emails_per_item,
    )
    return {"id": job_id, "status": "queued"}


@router.post("/start", response_model=MessageResponse)
async def start_imap_test(cfg: IMAPTestConfig):
    """Start IMAP login testing."""
    try:
        await imap_test_service.start(
            cfg.server, cfg.port, cfg.email, cfg.password
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return MessageResponse(message="started")


@router.post("/stop", response_model=MessageResponse)
async def stop_imap_test():
    """Stop current IMAP test if running."""
    if imap_test_service.metrics.state != IMAPTestState.RUNNING:
        return MessageResponse(message="not running")
    await imap_test_service.stop()
    return MessageResponse(
        message="stopped",
        data={"reason": imap_test_service.metrics.stop_reason},
    )


@router.get("/status")
async def imap_test_status():
    """Return current IMAP test metrics."""
    return imap_test_service.status()
