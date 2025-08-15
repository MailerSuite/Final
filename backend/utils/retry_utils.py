"""Central retry helpers for SMTP operations using tenacity."""

from smtplib import SMTPResponseException, SMTPServerDisconnected

from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

transient = (
    ConnectionError,
    TimeoutError,
    SMTPServerDisconnected,
    SMTPResponseException,
)


def smtp_retry(attempts: int = 3):
    """Return a retry decorator for SMTP operations."""
    return retry(
        reraise=True,
        stop=stop_after_attempt(attempts),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type(transient),
    )
