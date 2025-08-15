
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from sqlalchemy import text

from core.database import get_db
from core.email_validator import EmailValidator
from core.logger import get_logger
from core.smtp_checker import parse_smtp_list
from schemas.common import SuccessResponse
from schemas.jobs import Job, JobCreateRequest, JobLog, JobMode, JobStatus
from services.email_service import EmailService
from services.job_service import job_service

router = APIRouter()
logger = get_logger(__name__)


@router.post("/", response_model=Job)
async def create_job(
    background_tasks: BackgroundTasks,
    mode: JobMode = Form(...),
    template_id: str = Form(...),
    smtp_list_file: UploadFile = File(...),
    mails_list_file: UploadFile = File(...),
    proxy_list_file: UploadFile | None = File(None),
    db=Depends(get_db),
):
    try:
        smtp_content = (await smtp_list_file.read()).decode("utf-8")
        mails_content = (await mails_list_file.read()).decode("utf-8")
        proxy_content = None
        if proxy_list_file:
            proxy_content = (await proxy_list_file.read()).decode("utf-8")
        request = JobCreateRequest(
            mode=mode,
            template_id=template_id,
            smtp_accounts=[smtp_content],
            email_bases=[mails_content],
            proxy_servers=[proxy_content] if proxy_content else None,
            config={},
        )
        job = await job_service.create_job(request, db)
        background_tasks.add_task(start_email_job, job.id, request, db)
        return job
    except Exception as e:
        logger.error(f"Job creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=list[Job])
async def list_jobs(
    limit: int = 50,
    offset: int = 0,
    status: JobStatus | None = None,
    db=Depends(get_db),
):
    """List jobs"""
    try:
        jobs = await job_service.list_jobs(db, limit, offset, status)
        return jobs
    except Exception as e:
        logger.error(f"Job list error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{job_id}", response_model=Job)
async def get_job(job_id: str, db=Depends(get_db)):
    """Get job by ID"""
    try:
        job = await job_service.get_job(job_id, db)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Job get error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{job_id}/cancel", response_model=SuccessResponse)
async def cancel_job(job_id: str, db=Depends(get_db)):
    """Cancel job"""
    try:
        success = await job_service.cancel_job(job_id, db)
        if not success:
            raise HTTPException(
                status_code=400, detail="Job not found or cannot be cancelled"
            )
        return SuccessResponse(
            success=True, message="Job cancelled successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Job cancel error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{job_id}/logs", response_model=list[JobLog])
async def get_job_logs(
    job_id: str, limit: int = 100, offset: int = 0, db=Depends(get_db)
):
    """Get job logs"""
    try:
        logs_data = result = await db.execute(
            text(
                "SELECT * FROM job_logs WHERE job_id = :job_id ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
            ),
            {"job_id": job_id, "limit": limit, "offset": offset},
        )
        return [JobLog(**dict(log)) for log in logs_data]
    except Exception as e:
        logger.error(f"Job logs error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def start_email_job(
    job_id: str, request: JobCreateRequest, db_connection
):
    try:
        await job_service.update_job_status(
            job_id, JobStatus.RUNNING, db_connection
        )
        email_service = EmailService()
        smtp_accounts = parse_smtp_list(request.smtp_accounts[0])
        email_validator = EmailValidator()
        email_bases = email_validator.parse_email_list(request.email_bases[0])
        valid_emails = []
        for email_data in email_bases:
            if email_validator.validate_format(email_data["email"]):
                valid_emails.append(email_data)
        await job_service.update_job_progress(
            job_id, 0, 0, len(valid_emails), db_connection
        )
        template_data = result = await db_connection.execute(
            "SELECT * FROM email_templates WHERE id = $1", request.template_id
        )
        if not template_data:
            raise Exception("Template not found")
        await email_service.send_bulk_emails(
            job_id=job_id,
            smtp_accounts=smtp_accounts,
            email_bases=valid_emails,
            template=dict(template_data),
            mode=request.mode,
            db_connection=db_connection,
        )
        await job_service.update_job_status(
            job_id, JobStatus.COMPLETED, db_connection
        )
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        await job_service.update_job_status(
            job_id, JobStatus.FAILED, db_connection, str(e)
        )
