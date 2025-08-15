import asyncio
import uuid
from datetime import datetime, timedelta

from sqlalchemy import text

from core.logger import get_logger
from schemas.jobs import Job, JobCreateRequest, JobStatus

logger = get_logger(__name__)


class JobService:
    """Job management service"""

    def __init__(self):
        self.active_jobs: dict[str, asyncio.Task] = {}

    async def create_job(
        self, request: JobCreateRequest, db_connection
    ) -> Job:
        """Create a new job"""
        job_id = str(uuid.uuid4())
        await db_connection.execute(
            text(
                "INSERT INTO jobs (id, status, mode, config, created_at) VALUES (:job_id, :status, :mode, :config, :created_at)"
            ),
            {
                "job_id": job_id,
                "status": JobStatus.PENDING,
                "mode": request.mode,
                "config": request.config,
                "created_at": datetime.utcnow(),
            },
        )
        result = await db_connection.execute(
            text("SELECT * FROM jobs WHERE id = :job_id"), {"job_id": job_id}
        )
        job_data = result.fetchone()
        return Job(**dict(job_data))

    async def get_job(self, job_id: str, db_connection) -> Job | None:
        """Get job by ID"""
        result = await db_connection.execute(
            text("SELECT * FROM jobs WHERE id = :job_id"), {"job_id": job_id}
        )
        job_data = result.fetchone()
        if job_data:
            return Job(**dict(job_data))
        return None

    async def list_jobs(
        self,
        db_connection,
        limit: int = 50,
        offset: int = 0,
        status: JobStatus | None = None,
    ) -> list[Job]:
        """List jobs with pagination"""
        if status:
            query = text(
                "SELECT * FROM jobs WHERE status = :status ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
            )
            params = {"status": status, "limit": limit, "offset": offset}
        else:
            query = text(
                "SELECT * FROM jobs ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
            )
            params = {"limit": limit, "offset": offset}

        result = await db_connection.execute(query, params)
        jobs_data = result.fetchall()
        return [Job(**dict(job)) for job in jobs_data]

    async def update_job_status(
        self,
        job_id: str,
        status: JobStatus,
        db_connection,
        error_message: str | None = None,
    ):
        """Update job status"""
        params = {"job_id": job_id, "status": status}
        update_fields = ["status = :status"]

        if status == JobStatus.RUNNING:
            update_fields.append("started_at = :started_at")
            params["started_at"] = datetime.utcnow()
        elif status in [
            JobStatus.COMPLETED,
            JobStatus.FAILED,
            JobStatus.CANCELLED,
        ]:
            update_fields.append("completed_at = :completed_at")
            params["completed_at"] = datetime.utcnow()
        if error_message:
            update_fields.append("error_message = :error_message")
            params["error_message"] = error_message

        query = (
            f"UPDATE jobs SET {', '.join(update_fields)} WHERE id = :job_id"
        )
        await db_connection.execute(text(query), params)

    async def update_job_progress(
        self,
        job_id: str,
        sent_emails: int,
        failed_emails: int,
        total_emails: int,
        db_connection,
    ):
        """Update job progress"""
        progress = (
            (sent_emails + failed_emails) / total_emails
            if total_emails > 0
            else 0
        )
        await db_connection.execute(
            text(
                "UPDATE jobs SET sent_emails = :sent_emails, failed_emails = :failed_emails, total_emails = :total_emails, progress = :progress WHERE id = :job_id"
            ),
            {
                "job_id": job_id,
                "sent_emails": sent_emails,
                "failed_emails": failed_emails,
                "total_emails": total_emails,
                "progress": progress,
            },
        )

    async def cancel_job(self, job_id: str, db_connection) -> bool:
        """Cancel a running job"""
        result = await db_connection.execute(
            text(
                "UPDATE jobs SET status = :status WHERE id = :job_id AND status IN (:pending_status, :running_status)"
            ),
            {
                "job_id": job_id,
                "status": JobStatus.CANCELLED,
                "pending_status": JobStatus.PENDING,
                "running_status": JobStatus.RUNNING,
            },
        )
        if job_id in self.active_jobs:
            task = self.active_jobs[job_id]
            task.cancel()
            del self.active_jobs[job_id]
        return result != "UPDATE 0"

    async def cleanup_old_jobs(self, db_connection, hours: int = 24):
        """Clean up old completed jobs"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        await db_connection.execute(
            text(
                "DELETE FROM jobs WHERE status IN (:completed_status, :failed_status, :cancelled_status) AND completed_at < :cutoff_time"
            ),
            {
                "completed_status": JobStatus.COMPLETED,
                "failed_status": JobStatus.FAILED,
                "cancelled_status": JobStatus.CANCELLED,
                "cutoff_time": cutoff_time,
            },
        )
        logger.info(f"Cleaned up jobs older than {hours} hours")

    def register_job_task(self, job_id: str, task: asyncio.Task):
        """Register a job task for cancellation"""
        self.active_jobs[job_id] = task

    def unregister_job_task(self, job_id: str):
        """Unregister a job task"""
        if job_id in self.active_jobs:
            del self.active_jobs[job_id]


job_service = JobService()
