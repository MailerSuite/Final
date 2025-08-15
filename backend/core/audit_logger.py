"""
High-Performance Audit Logging System
Handles security events, compliance logging, and real-time monitoring
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from uuid import uuid4

import aiofiles
import aiohttp
from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, Integer, String, Text, and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import declarative_base

# Performance imports
try:
    import ujson as json_lib
except ImportError:
    import json as json_lib

Base = declarative_base()

logger = logging.getLogger(__name__)


class AuditLevel(str, Enum):
    """Audit logging levels"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AuditEventType(str, Enum):
    """Types of audit events"""
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    PERMISSION_DENIED = "permission_denied"
    DATA_ACCESS = "data_access"
    DATA_MODIFICATION = "data_modification"
    SECURITY_VIOLATION = "security_violation"
    SYSTEM_ERROR = "system_error"
    API_CALL = "api_call"


class AuditEvent(BaseModel):
    """Audit event structure"""
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    event_type: AuditEventType
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    resource: Optional[str] = None
    action: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    risk_score: int = Field(default=0, ge=0, le=100)
    session_id: Optional[str] = None
    outcome: str = "unknown"  # success, failure, blocked
    compliance_tags: List[str] = Field(default_factory=list)


class AuditEventDB(Base):
    """Database model for audit events"""
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True)
    event_id = Column(String(36), unique=True, nullable=False)
    event_type = Column(String(50), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    user_id = Column(String(36), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    resource = Column(String(255), nullable=True)
    action = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)  # JSON string
    risk_score = Column(Integer, default=0)
    session_id = Column(String(36), nullable=True)
    outcome = Column(String(20), default="unknown")
    compliance_tags = Column(Text, nullable=True)  # JSON array


class AuditLogger:
    """
    High-performance audit logging system with real-time alerting
    Supports file, database, and external system logging
    """

    def __init__(
        self,
        log_file: str = "logs/audit.log",
        db_session: Optional[AsyncSession] = None,
        enable_real_time: bool = True,
        buffer_size: int = 1000,
        flush_interval: int = 30,
    ):
        self.log_file = log_file
        self.db_session = db_session
        self.enable_real_time = enable_real_time
        self.buffer_size = buffer_size
        self.flush_interval = flush_interval
        
        # In-memory buffer for high-performance logging
        self.event_buffer: List[AuditEvent] = []
        self.last_flush = time.time()
        
        # Risk scoring thresholds
        self.risk_thresholds = {
            "HIGH_RISK_SCORE": 80,
            "MEDIUM_RISK_SCORE": 50,
            "ALERT_THRESHOLD": 90
        }
        
        # Alerting configuration
        self.alerting_config = {
            "email": {
                "enabled": os.getenv("AUDIT_EMAIL_ALERTS", "false").lower() == "true",
                "smtp_server": os.getenv("SMTP_SERVER"),
                "smtp_port": int(os.getenv("SMTP_PORT", "587")),
                "email_user": os.getenv("SMTP_USER"),
                "email_password": os.getenv("SMTP_PASSWORD"),
                "alert_recipients": os.getenv("AUDIT_ALERT_EMAILS", "").split(",")
            },
            "slack": {
                "enabled": os.getenv("AUDIT_SLACK_ALERTS", "false").lower() == "true",
                "webhook_url": os.getenv("SLACK_WEBHOOK_URL"),
                "channel": os.getenv("SLACK_ALERT_CHANNEL", "#security-alerts")
            },
            "pagerduty": {
                "enabled": os.getenv("AUDIT_PAGERDUTY_ALERTS", "false").lower() == "true",
                "integration_key": os.getenv("PAGERDUTY_INTEGRATION_KEY"),
                "service_url": "https://events.pagerduty.com/v2/enqueue"
            }
        }

        # Ensure log directory exists
        os.makedirs(os.path.dirname(self.log_file), exist_ok=True)

    async def log_event(
        self,
        event_type: AuditEventType,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        resource: Optional[str] = None,
        action: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        outcome: str = "success",
        compliance_tags: Optional[List[str]] = None,
    ) -> str:
        """Log an audit event with automatic risk scoring"""
        
        # Create audit event
        event = AuditEvent(
            event_type=event_type,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            resource=resource,
            action=action,
            details=details or {},
            outcome=outcome,
            compliance_tags=compliance_tags or [],
        )
        
        # Calculate risk score
        event.risk_score = self._calculate_risk_score(event)
        
        # Add to buffer
        self.event_buffer.append(event)
        
        # Handle high-priority events immediately
        if event.risk_score >= self.risk_thresholds["ALERT_THRESHOLD"]:
            await self._send_security_alert(event)
        
        # Flush buffer if needed
        if (
            len(self.event_buffer) >= self.buffer_size
            or time.time() - self.last_flush >= self.flush_interval
        ):
            await self._flush_buffer()
        
        return event.event_id

    async def log_security_event(
        self,
        event_type: str,
        severity: str = "MEDIUM",
        details: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> str:
        """Log a security-specific event with enhanced details"""
        
        # Map severity to risk score
        severity_scores = {
            "LOW": 20,
            "MEDIUM": 50,
            "HIGH": 80,
            "CRITICAL": 95
        }
        
        base_risk = severity_scores.get(severity.upper(), 50)
        
        event = AuditEvent(
            event_type=AuditEventType.SECURITY_VIOLATION,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            action=event_type,
            details=details or {},
            risk_score=base_risk,
            compliance_tags=["security", severity.lower()],
            outcome="detected"
        )
        
        # Add to buffer and handle alerting
        self.event_buffer.append(event)
        
        if event.risk_score >= self.risk_thresholds["ALERT_THRESHOLD"]:
            await self._send_security_alert(event)
        
        if len(self.event_buffer) >= self.buffer_size:
            await self._flush_buffer()
            
        return event.event_id

    def _calculate_risk_score(self, event: AuditEvent) -> int:
        """Calculate risk score based on event characteristics"""
        score = 0
        
        # Base scores by event type
        type_scores = {
            AuditEventType.USER_LOGIN: 10,
            AuditEventType.USER_LOGOUT: 5,
            AuditEventType.PERMISSION_DENIED: 70,
            AuditEventType.DATA_ACCESS: 30,
            AuditEventType.DATA_MODIFICATION: 50,
            AuditEventType.SECURITY_VIOLATION: 80,
            AuditEventType.SYSTEM_ERROR: 40,
            AuditEventType.API_CALL: 15,
        }
        
        score += type_scores.get(event.event_type, 25)
        
        # Increase score for failures
        if event.outcome in ["failure", "blocked", "denied"]:
            score += 30
        
        # Increase score for suspicious patterns
        if event.details:
            suspicious_keywords = ["injection", "xss", "script", "drop", "union", "admin"]
            details_str = str(event.details).lower()
            for keyword in suspicious_keywords:
                if keyword in details_str:
                    score += 20
                    break
        
        # IP-based risk factors
        if event.ip_address:
            # Check for private IPs (lower risk)
            if event.ip_address.startswith(("192.168.", "10.", "172.")):
                score -= 10
            # Check for known bad patterns
            elif any(pattern in event.ip_address for pattern in ["tor", "proxy", "vpn"]):
                score += 25
        
        # Time-based factors (outside business hours = higher risk)
        current_hour = datetime.now().hour
        if current_hour < 6 or current_hour > 22:  # Outside 6 AM - 10 PM
            score += 15
        
        return min(max(score, 0), 100)  # Clamp between 0-100

    async def _send_security_alert(self, event: AuditEvent) -> None:
        """Send security alert for high-risk events"""
        try:
            # Implement comprehensive alerting system
            alert_message = (
                f"HIGH RISK SECURITY EVENT: {event.event_type.value} - "
                f"Risk Score: {event.risk_score}"
            )
            
            # Send alerts through multiple channels
            await asyncio.gather(
                self._send_email_alert(event, alert_message),
                self._send_slack_alert(event, alert_message),
                self._send_pagerduty_alert(event, alert_message),
                return_exceptions=True
            )
            
            await self._log_internal_event(
                alert_message, level=AuditLevel.CRITICAL
            )
        except Exception as e:
            await self._log_internal_event(
                f"Failed to send security alert: {e}", level=AuditLevel.HIGH
            )

    async def _send_email_alert(self, event: AuditEvent, message: str) -> None:
        """Send email alert for security events"""
        if not self.alerting_config["email"]["enabled"]:
            return
            
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            config = self.alerting_config["email"]
            
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = config["email_user"]
            msg['Subject'] = f"🚨 SGPT Security Alert - {event.event_type.value}"
            
            # Email body
            body = f"""
SECURITY ALERT - IMMEDIATE ATTENTION REQUIRED

Event Type: {event.event_type.value}
Risk Score: {event.risk_score}/100
Timestamp: {event.timestamp}
User ID: {event.user_id or 'Unknown'}
IP Address: {event.ip_address or 'Unknown'}
Action: {event.action or 'N/A'}
Outcome: {event.outcome}

Details:
{json.dumps(event.details, indent=2) if event.details else 'No additional details'}

Event ID: {event.event_id}

Please investigate immediately.

--
SGPT Security System
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Send to all recipients
            server = smtplib.SMTP(config["smtp_server"], config["smtp_port"])
            server.starttls()
            server.login(config["email_user"], config["email_password"])
            
            for recipient in config["alert_recipients"]:
                if recipient.strip():
                    msg['To'] = recipient.strip()
                    server.send_message(msg)
                    del msg['To']
            
            server.quit()
            logger.info(f"Email alert sent for event {event.event_id}")
            
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")

    async def _send_slack_alert(self, event: AuditEvent, message: str) -> None:
        """Send Slack alert for security events"""
        if not self.alerting_config["slack"]["enabled"]:
            return
            
        try:
            config = self.alerting_config["slack"]
            
            # Slack message payload
            payload = {
                "channel": config["channel"],
                "username": "SGPT Security Bot",
                "icon_emoji": ":warning:",
                "attachments": [
                    {
                        "color": "danger",
                        "title": f"🚨 Security Alert - {event.event_type.value}",
                        "fields": [
                            {
                                "title": "Risk Score",
                                "value": f"{event.risk_score}/100",
                                "short": True
                            },
                            {
                                "title": "IP Address",
                                "value": event.ip_address or "Unknown",
                                "short": True
                            },
                            {
                                "title": "User ID",
                                "value": event.user_id or "Unknown",
                                "short": True
                            },
                            {
                                "title": "Outcome",
                                "value": event.outcome,
                                "short": True
                            },
                            {
                                "title": "Timestamp",
                                "value": event.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC"),
                                "short": False
                            }
                        ],
                        "footer": f"Event ID: {event.event_id}",
                        "ts": int(event.timestamp.timestamp())
                    }
                ]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    config["webhook_url"],
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        logger.info(f"Slack alert sent for event {event.event_id}")
                    else:
                        logger.error(f"Slack alert failed with status {response.status}")
                        
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {e}")

    async def _send_pagerduty_alert(self, event: AuditEvent, message: str) -> None:
        """Send PagerDuty alert for critical security events"""
        if not self.alerting_config["pagerduty"]["enabled"]:
            return
            
        try:
            config = self.alerting_config["pagerduty"]
            
            # PagerDuty event payload
            payload = {
                "routing_key": config["integration_key"],
                "event_action": "trigger",
                "dedup_key": f"sgpt-security-{event.event_type.value}-{event.ip_address}",
                "payload": {
                    "summary": f"SGPT Security Alert: {event.event_type.value} (Risk: {event.risk_score})",
                    "source": "SGPT Security System",
                    "severity": "critical" if event.risk_score >= 90 else "error",
                    "timestamp": event.timestamp.isoformat(),
                    "custom_details": {
                        "event_id": event.event_id,
                        "event_type": event.event_type.value,
                        "risk_score": event.risk_score,
                        "user_id": event.user_id,
                        "ip_address": event.ip_address,
                        "user_agent": event.user_agent,
                        "action": event.action,
                        "outcome": event.outcome,
                        "details": event.details
                    }
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    config["service_url"],
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 202:
                        logger.info(f"PagerDuty alert sent for event {event.event_id}")
                    else:
                        logger.error(f"PagerDuty alert failed with status {response.status}")
                        
        except Exception as e:
            logger.error(f"Failed to send PagerDuty alert: {e}")

    async def _flush_buffer(self) -> None:
        """Flush buffered events to storage"""
        if not self.event_buffer:
            return
        
        events_to_flush = self.event_buffer.copy()
        self.event_buffer.clear()
        self.last_flush = time.time()
        
        # Write to file
        await self._write_to_file(events_to_flush)
        
        # Write to database if available
        if self.db_session:
            await self._write_to_database(events_to_flush)

    async def _write_to_file(self, events: List[AuditEvent]) -> None:
        """Write events to log file"""
        try:
            async with aiofiles.open(self.log_file, "a", encoding="utf-8") as f:
                for event in events:
                    log_entry = {
                        "timestamp": event.timestamp.isoformat(),
                        "event_id": event.event_id,
                        "event_type": event.event_type.value,
                        "risk_score": event.risk_score,
                        "user_id": event.user_id,
                        "ip_address": event.ip_address,
                        "user_agent": event.user_agent,
                        "resource": event.resource,
                        "action": event.action,
                        "outcome": event.outcome,
                        "details": event.details,
                        "compliance_tags": event.compliance_tags,
                    }
                    await f.write(json_lib.dumps(log_entry) + "\n")
        except Exception as e:
            logger.error(f"Failed to write audit events to file: {e}")

    async def _write_to_database(self, events: List[AuditEvent]) -> None:
        """Write events to database"""
        try:
            db_events = []
            for event in events:
                db_event = AuditEventDB(
                    event_id=event.event_id,
                    event_type=event.event_type.value,
                    timestamp=event.timestamp,
                    user_id=event.user_id,
                    ip_address=event.ip_address,
                    user_agent=event.user_agent,
                    resource=event.resource,
                    action=event.action,
                    details=json_lib.dumps(event.details) if event.details else None,
                    risk_score=event.risk_score,
                    session_id=event.session_id,
                    outcome=event.outcome,
                    compliance_tags=json_lib.dumps(event.compliance_tags),
                )
                db_events.append(db_event)
            
            self.db_session.add_all(db_events)
            await self.db_session.commit()
            
        except Exception as e:
            logger.error(f"Failed to write audit events to database: {e}")
            await self.db_session.rollback()

    async def _log_internal_event(self, message: str, level: AuditLevel = AuditLevel.MEDIUM) -> None:
        """Log internal audit system events"""
        internal_event = AuditEvent(
            event_type=AuditEventType.SYSTEM_ERROR,
            action="internal_audit_log",
            details={"message": message, "level": level.value},
            outcome="logged",
            compliance_tags=["internal", "audit_system"]
        )
        self.event_buffer.append(internal_event)

    async def query_events(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        event_type: Optional[AuditEventType] = None,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        min_risk_score: Optional[int] = None,
        limit: int = 1000,
    ) -> List[AuditEvent]:
        """Query audit events with filters"""
        if not self.db_session:
            raise ValueError("Database session required for querying")
        
        query = select(AuditEventDB)
        
        filters = []
        if start_time:
            filters.append(AuditEventDB.timestamp >= start_time)
        if end_time:
            filters.append(AuditEventDB.timestamp <= end_time)
        if event_type:
            filters.append(AuditEventDB.event_type == event_type.value)
        if user_id:
            filters.append(AuditEventDB.user_id == user_id)
        if ip_address:
            filters.append(AuditEventDB.ip_address == ip_address)
        if min_risk_score:
            filters.append(AuditEventDB.risk_score >= min_risk_score)
        
        if filters:
            query = query.where(and_(*filters))
        
        query = query.order_by(AuditEventDB.timestamp.desc()).limit(limit)
        
        result = await self.db_session.execute(query)
        db_events = result.scalars().all()
        
        # Convert to AuditEvent objects
        events = []
        for db_event in db_events:
            event = AuditEvent(
                event_id=db_event.event_id,
                event_type=AuditEventType(db_event.event_type),
                timestamp=db_event.timestamp,
                user_id=db_event.user_id,
                ip_address=db_event.ip_address,
                user_agent=db_event.user_agent,
                resource=db_event.resource,
                action=db_event.action,
                details=json_lib.loads(db_event.details) if db_event.details else None,
                risk_score=db_event.risk_score,
                session_id=db_event.session_id,
                outcome=db_event.outcome,
                compliance_tags=json_lib.loads(db_event.compliance_tags) if db_event.compliance_tags else [],
            )
            events.append(event)
        
        return events

    async def get_security_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get security summary for the last N hours"""
        if not self.db_session:
            return {"error": "Database session required"}
        
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        # Basic event counts
        total_events_query = select(func.count(AuditEventDB.id)).where(
            AuditEventDB.timestamp >= cutoff_time
        )
        total_events = await self.db_session.scalar(total_events_query)
        
        # High-risk events
        high_risk_query = select(func.count(AuditEventDB.id)).where(
            and_(
                AuditEventDB.timestamp >= cutoff_time,
                AuditEventDB.risk_score >= self.risk_thresholds["HIGH_RISK_SCORE"]
            )
        )
        high_risk_events = await self.db_session.scalar(high_risk_query)
        
        # Failed events
        failed_events_query = select(func.count(AuditEventDB.id)).where(
            and_(
                AuditEventDB.timestamp >= cutoff_time,
                AuditEventDB.outcome.in_(["failure", "blocked", "denied"])
            )
        )
        failed_events = await self.db_session.scalar(failed_events_query)
        
        return {
            "time_period_hours": hours,
            "total_events": total_events or 0,
            "high_risk_events": high_risk_events or 0,
            "failed_events": failed_events or 0,
            "security_score": max(0, 100 - (high_risk_events or 0) * 5),
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }

    async def cleanup_old_events(self, days: int = 90) -> int:
        """Clean up old audit events"""
        if not self.db_session:
            return 0
        
        from datetime import timedelta
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Delete old events
        delete_query = select(AuditEventDB).where(
            AuditEventDB.timestamp < cutoff_date
        )
        result = await self.db_session.execute(delete_query)
        events_to_delete = result.scalars().all()
        
        deleted_count = len(events_to_delete)
        
        for event in events_to_delete:
            await self.db_session.delete(event)
        
        await self.db_session.commit()
        
        logger.info(f"Cleaned up {deleted_count} old audit events")
        return deleted_count


# Global audit logger instance
audit_logger = AuditLogger()
