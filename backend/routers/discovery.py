"""
Discovery Router
Handles automatic discovery of SMTP and IMAP server settings
"""

import logging
import socket
from typing import Any

import dns.resolver
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from core.dependencies import get_current_user
from models import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/discovery", tags=["System"])


# Schemas
class EmailDiscoveryRequest(BaseModel):
    email: EmailStr


class SMTPHost(BaseModel):
    host: str
    port: int
    security: str  # 'ssl', 'tls', 'none'
    priority: int = 0


class IMAPHost(BaseModel):
    host: str
    port: int
    security: str  # 'ssl', 'tls', 'none'
    priority: int = 0


class HostDiscoveryResponse(BaseModel):
    email: str
    domain: str
    smtp_hosts: list[SMTPHost]
    imap_hosts: list[IMAPHost]
    success: bool
    message: str


# Common email provider configurations
KNOWN_PROVIDERS = {
    "gmail.com": {
        "smtp": [
            {
                "host": "smtp.gmail.com",
                "port": 587,
                "security": "tls",
                "priority": 1,
            }
        ],
        "imap": [
            {
                "host": "imap.gmail.com",
                "port": 993,
                "security": "ssl",
                "priority": 1,
            }
        ],
    },
    "outlook.com": {
        "smtp": [
            {
                "host": "smtp-mail.outlook.com",
                "port": 587,
                "security": "tls",
                "priority": 1,
            }
        ],
        "imap": [
            {
                "host": "outlook.office365.com",
                "port": 993,
                "security": "ssl",
                "priority": 1,
            }
        ],
    },
    "hotmail.com": {
        "smtp": [
            {
                "host": "smtp-mail.outlook.com",
                "port": 587,
                "security": "tls",
                "priority": 1,
            }
        ],
        "imap": [
            {
                "host": "outlook.office365.com",
                "port": 993,
                "security": "ssl",
                "priority": 1,
            }
        ],
    },
    "yahoo.com": {
        "smtp": [
            {
                "host": "smtp.mail.yahoo.com",
                "port": 587,
                "security": "tls",
                "priority": 1,
            }
        ],
        "imap": [
            {
                "host": "imap.mail.yahoo.com",
                "port": 993,
                "security": "ssl",
                "priority": 1,
            }
        ],
    },
    "icloud.com": {
        "smtp": [
            {
                "host": "smtp.mail.me.com",
                "port": 587,
                "security": "tls",
                "priority": 1,
            }
        ],
        "imap": [
            {
                "host": "imap.mail.me.com",
                "port": 993,
                "security": "ssl",
                "priority": 1,
            }
        ],
    },
}


def discover_mx_records(domain: str) -> list[str]:
    """Discover MX records for a domain"""
    try:
        mx_records = dns.resolver.resolve(domain, "MX")
        return [str(mx.exchange).rstrip(".") for mx in mx_records]
    except Exception as e:
        logger.warning(f"Failed to resolve MX records for {domain}: {e}")
        return []


def discover_smtp_hosts(domain: str) -> list[SMTPHost]:
    """Discover SMTP hosts for a domain"""
    hosts = []

    # Check known providers first
    if domain in KNOWN_PROVIDERS:
        for config in KNOWN_PROVIDERS[domain]["smtp"]:
            hosts.append(SMTPHost(**config))
        return hosts

    # Try common SMTP host patterns
    common_patterns = [
        f"smtp.{domain}",
        f"mail.{domain}",
        f"outgoing.{domain}",
        f"send.{domain}",
    ]

    # Add MX records
    mx_records = discover_mx_records(domain)
    common_patterns.extend(mx_records)

    for host in common_patterns:
        # Try common SMTP ports
        for port, security in [(587, "tls"), (465, "ssl"), (25, "none")]:
            try:
                # Test connection
                sock = socket.create_connection((host, port), timeout=5)
                sock.close()
                hosts.append(
                    SMTPHost(
                        host=host, port=port, security=security, priority=2
                    )
                )
                break  # Found working port for this host
            except Exception:
                continue

    return hosts


def discover_imap_hosts(domain: str) -> list[IMAPHost]:
    """Discover IMAP hosts for a domain"""
    hosts = []

    # Check known providers first
    if domain in KNOWN_PROVIDERS:
        for config in KNOWN_PROVIDERS[domain]["imap"]:
            hosts.append(IMAPHost(**config))
        return hosts

    # Try common IMAP host patterns
    common_patterns = [
        f"imap.{domain}",
        f"mail.{domain}",
        f"incoming.{domain}",
        f"receive.{domain}",
    ]

    # Add MX records
    mx_records = discover_mx_records(domain)
    common_patterns.extend(mx_records)

    for host in common_patterns:
        # Try common IMAP ports
        for port, security in [(993, "ssl"), (143, "tls")]:
            try:
                # Test connection
                sock = socket.create_connection((host, port), timeout=5)
                sock.close()
                hosts.append(
                    IMAPHost(
                        host=host, port=port, security=security, priority=2
                    )
                )
                break  # Found working port for this host
            except Exception:
                continue

    return hosts


@router.post("/smtp-hosts", response_model=HostDiscoveryResponse)
async def discover_smtp_hosts_endpoint(
    request: EmailDiscoveryRequest,
    current_user: User = Depends(get_current_user),
) -> HostDiscoveryResponse:
    """
    Discover SMTP server settings for an email address
    """
    try:
        domain = request.email.split("@")[1].lower()

        smtp_hosts = discover_smtp_hosts(domain)

        if not smtp_hosts:
            return HostDiscoveryResponse(
                email=str(request.email),
                domain=domain,
                smtp_hosts=[],
                imap_hosts=[],
                success=False,
                message=f"No SMTP hosts found for domain {domain}",
            )

        return HostDiscoveryResponse(
            email=str(request.email),
            domain=domain,
            smtp_hosts=smtp_hosts,
            imap_hosts=[],
            success=True,
            message=f"Found {len(smtp_hosts)} SMTP hosts for {domain}",
        )

    except Exception as e:
        logger.error(f"SMTP discovery failed for {request.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SMTP discovery failed: {str(e)}",
        )


@router.post("/imap-hosts", response_model=HostDiscoveryResponse)
async def discover_imap_hosts_endpoint(
    request: EmailDiscoveryRequest,
    current_user: User = Depends(get_current_user),
) -> HostDiscoveryResponse:
    """
    Discover IMAP server settings for an email address
    """
    try:
        domain = request.email.split("@")[1].lower()

        imap_hosts = discover_imap_hosts(domain)

        if not imap_hosts:
            return HostDiscoveryResponse(
                email=str(request.email),
                domain=domain,
                smtp_hosts=[],
                imap_hosts=[],
                success=False,
                message=f"No IMAP hosts found for domain {domain}",
            )

        return HostDiscoveryResponse(
            email=str(request.email),
            domain=domain,
            smtp_hosts=[],
            imap_hosts=imap_hosts,
            success=True,
            message=f"Found {len(imap_hosts)} IMAP hosts for {domain}",
        )

    except Exception as e:
        logger.error(f"IMAP discovery failed for {request.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"IMAP discovery failed: {str(e)}",
        )


@router.post("/email-hosts", response_model=HostDiscoveryResponse)
async def discover_email_hosts(
    request: EmailDiscoveryRequest,
    current_user: User = Depends(get_current_user),
) -> HostDiscoveryResponse:
    """
    Discover both SMTP and IMAP server settings for an email address
    """
    try:
        domain = request.email.split("@")[1].lower()

        smtp_hosts = discover_smtp_hosts(domain)
        imap_hosts = discover_imap_hosts(domain)

        success = len(smtp_hosts) > 0 or len(imap_hosts) > 0
        message = f"Found {len(smtp_hosts)} SMTP and {len(imap_hosts)} IMAP hosts for {domain}"

        if not success:
            message = f"No email hosts found for domain {domain}"

        return HostDiscoveryResponse(
            email=str(request.email),
            domain=domain,
            smtp_hosts=smtp_hosts,
            imap_hosts=imap_hosts,
            success=success,
            message=message,
        )

    except Exception as e:
        logger.error(f"Email host discovery failed for {request.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email host discovery failed: {str(e)}",
        )


@router.get("/providers")
async def get_known_providers(
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Get list of known email providers and their configurations
    """
    return {
        "providers": list(KNOWN_PROVIDERS.keys()),
        "total_providers": len(KNOWN_PROVIDERS),
        "configurations": KNOWN_PROVIDERS,
    }
