import smtplib
import socket
import time
from typing import Any

from email_validator import EmailNotValidError, validate_email
from sqlalchemy import func

from core.celery_app import celery_app
from core.database import get_db
from core.logger import get_logger
from models.base import LeadEntry
from utils.check_logging import log_check_result_sync

logger = get_logger(__name__)


@celery_app.task(bind=True, max_retries=3)
def validate_lead_smtp(self, lead_id: str) -> dict[str, Any]:
    start_ts = time.time()
    try:
        db = next(get_db())
        lead = db.query(LeadEntry).filter(LeadEntry.id == lead_id).first()
        if not lead:
            result = {"error": "Lead not found", "lead_id": lead_id}
            log_check_result_sync(
                db,
                check_type="email_validation",
                input_params={"lead_id": lead_id},
                status="error",
                response=result,
                error="Lead not found",
                duration=time.time() - start_ts,
            )
            return result
        email = lead.email
        result = {
            "lead_id": lead_id,
            "email": email,
            "is_valid": False,
            "checks": {},
        }
        try:
            validate_email(email)
            result["checks"]["format"] = True
        except EmailNotValidError as e:
            result["checks"]["format"] = False
            result["error"] = f"Invalid format: {str(e)}"
            lead.status = "invalid"
            lead.validation_error = result["error"]
            db.commit()
            log_check_result_sync(
                db,
                check_type="email_validation",
                input_params={"lead_id": lead_id, "email": email},
                status="error",
                response=result,
                error=result["error"],
                duration=time.time() - start_ts,
            )
            return result
        domain = email.split("@")[1]
        try:
            socket.gethostbyname(domain)
            result["checks"]["domain"] = True
        except socket.gaierror:
            result["checks"]["domain"] = False
            result["error"] = "Domain does not exist"
            lead.status = "invalid"
            lead.validation_error = result["error"]
            db.commit()
            log_check_result_sync(
                db,
                check_type="email_validation",
                input_params={"lead_id": lead_id, "email": email},
                status="error",
                response=result,
                error=result["error"],
                duration=time.time() - start_ts,
            )
            return result
        try:
            mx_record = socket.getfqdn(domain)
            with smtplib.SMTP(mx_record, 25, timeout=10) as server:
                server.helo()
                server.mail("test@example.com")
                code, message = server.rcpt(email)
                if code == 250:
                    result["checks"]["smtp"] = True
                    result["is_valid"] = True
                    lead.status = "valid"
                    lead.validation_error = None
                else:
                    result["checks"]["smtp"] = False
                    result["error"] = f"SMTP error: {message.decode()}"
                    lead.status = "invalid"
                    lead.validation_error = result["error"]
        except Exception as smtp_error:
            result["checks"]["smtp"] = False
            result["error"] = f"SMTP check failed: {str(smtp_error)}"
            lead.status = "invalid"
            lead.validation_error = result["error"]
        lead.last_validated = func.now()
        db.commit()
        db.close()
        logger.info(
            f"Lead validation completed: {lead_id} - {result['is_valid']}"
        )
        log_check_result_sync(
            db,
            check_type="email_validation",
            input_params={"lead_id": lead_id, "email": email},
            status="success" if result["is_valid"] else "fail",
            response=result,
            error=result.get("error"),
            duration=time.time() - start_ts,
        )
        return result
    except Exception as e:
        logger.error(f"Lead validation failed: {lead_id} - {str(e)}")
        log_check_result_sync(
            db,
            check_type="email_validation",
            input_params={"lead_id": lead_id},
            status="error",
            response=None,
            error=str(e),
            duration=time.time() - start_ts,
        )
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60 * (self.request.retries + 1))
        return {
            "lead_id": lead_id,
            "error": f"Validation failed after retries: {str(e)}",
            "is_valid": False,
        }


@celery_app.task
def bulk_validate_leads(base_id: str, lead_ids: list) -> dict[str, Any]:
    """Bulk validation of leads in database."""
    results = []
    for lead_id in lead_ids:
        result = validate_lead_smtp.delay(lead_id)
        results.append(result.id)
    return {
        "base_id": base_id,
        "total_leads": len(lead_ids),
        "task_ids": results,
        "message": "Bulk validation started",
    }
