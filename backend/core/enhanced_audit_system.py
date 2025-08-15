"""
Enhanced Audit System with Compliance and Analytics
Extends the existing audit logger with advanced features
"""

import asyncio
import hashlib
import json
import logging
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

from .audit_logger import AuditEventType, AuditLevel, AuditLogger

logger = logging.getLogger(__name__)


class ComplianceStandard(Enum):
    GDPR = "gdpr"
    SOX = "sox"
    HIPAA = "hipaa"
    PCI_DSS = "pci_dss"
    ISO_27001 = "iso_27001"
    CCPA = "ccpa"


class AlertSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ComplianceReport:
    standard: ComplianceStandard
    period_start: datetime
    period_end: datetime
    total_events: int
    critical_events: int
    failed_events: int
    coverage_percentage: float
    findings: list[dict[str, Any]]
    recommendations: list[str]
    generated_at: datetime
    report_id: str


@dataclass
class SecurityAlert:
    alert_id: str
    timestamp: datetime
    severity: AlertSeverity
    alert_type: str
    description: str
    affected_user: str | None
    affected_resource: str | None
    risk_score: int
    details: dict[str, Any]
    actions_taken: list[str]


@dataclass
class AuditQuery:
    start_date: datetime | None = None
    end_date: datetime | None = None
    user_ids: list[str] | None = None
    event_types: list[AuditEventType] | None = None
    risk_score_min: int | None = None
    outcomes: list[str] | None = None
    resources: list[str] | None = None
    ip_addresses: list[str] | None = None
    limit: int = 1000
    offset: int = 0


class EnhancedAuditSystem:
    """Enhanced audit system with compliance, analytics, and real-time monitoring"""

    def __init__(self, base_audit_logger: AuditLogger):
        self.base_logger = base_audit_logger

        # Enhanced features
        self.compliance_rules = self._initialize_compliance_rules()
        self.alert_rules = self._initialize_alert_rules()
        self.alert_history: list[SecurityAlert] = []

        # Real-time monitoring
        self.active_sessions: dict[str, dict[str, Any]] = {}
        self.pattern_detectors: dict[str, list[datetime]] = {}
        self.risk_profiles: dict[str, dict[str, Any]] = {}

        # Analytics cache
        self.analytics_cache: dict[str, Any] = {}
        self.cache_timestamps: dict[str, datetime] = {}

        # Background tasks
        self._monitoring_task: asyncio.Task | None = None
        self._compliance_task: asyncio.Task | None = None
        self._cleanup_task: asyncio.Task | None = None

    def _initialize_compliance_rules(
        self,
    ) -> dict[ComplianceStandard, dict[str, Any]]:
        """Initialize compliance-specific requirements"""
        return {
            ComplianceStandard.GDPR: {
                "required_events": [
                    AuditEventType.DATA_ACCESS,
                    AuditEventType.DATA_MODIFY,
                    AuditEventType.DATA_DELETE,
                    AuditEventType.DATA_EXPORT,
                    AuditEventType.CONSENT_GIVEN,
                    AuditEventType.CONSENT_WITHDRAWN,
                ],
                "retention_years": 3,
                "requires_purpose_tracking": True,
                "requires_consent_tracking": True,
                "requires_breach_notification": True,
                "breach_notification_hours": 72,
                "mandatory_fields": [
                    "user_id",
                    "data_category",
                    "processing_purpose",
                    "legal_basis",
                ],
            },
            ComplianceStandard.SOX: {
                "required_events": [
                    AuditEventType.ADMIN_ACCESS,
                    AuditEventType.CONFIG_CHANGE,
                    AuditEventType.PRIVILEGE_ESCALATION,
                    AuditEventType.DATA_MODIFY,
                    AuditEventType.FINANCIAL_TRANSACTION,
                ],
                "retention_years": 7,
                "requires_integrity_verification": True,
                "requires_segregation_of_duties": True,
                "requires_change_approval": True,
                "mandatory_fields": [
                    "user_id",
                    "approver_id",
                    "change_type",
                    "business_justification",
                ],
            },
            ComplianceStandard.HIPAA: {
                "required_events": [
                    AuditEventType.DATA_ACCESS,
                    AuditEventType.DATA_MODIFY,
                    AuditEventType.DATA_EXPORT,
                    AuditEventType.LOGIN_SUCCESS,
                    AuditEventType.LOGIN_FAILURE,
                    AuditEventType.PATIENT_RECORD_ACCESS,
                ],
                "retention_years": 6,
                "requires_minimum_necessary": True,
                "requires_encryption": True,
                "requires_access_controls": True,
                "requires_breach_assessment": True,
                "mandatory_fields": [
                    "user_id",
                    "patient_id",
                    "access_reason",
                    "minimum_necessary",
                ],
            },
            ComplianceStandard.PCI_DSS: {
                "required_events": [
                    AuditEventType.PAYMENT_PROCESS,
                    AuditEventType.CARD_DATA_ACCESS,
                    AuditEventType.DATA_ACCESS,
                    AuditEventType.SECURITY_VIOLATION,
                    AuditEventType.ADMIN_ACCESS,
                    AuditEventType.SYSTEM_CHANGE,
                ],
                "retention_months": 12,
                "requires_daily_review": True,
                "requires_real_time_monitoring": True,
                "requires_network_monitoring": True,
                "mandatory_fields": [
                    "user_id",
                    "card_data_type",
                    "security_level",
                    "network_location",
                ],
            },
            ComplianceStandard.ISO_27001: {
                "required_events": [
                    AuditEventType.SECURITY_INCIDENT,
                    AuditEventType.ACCESS_CONTROL_CHANGE,
                    AuditEventType.VULNERABILITY_DETECTED,
                    AuditEventType.SECURITY_POLICY_CHANGE,
                    AuditEventType.RISK_ASSESSMENT,
                ],
                "retention_years": 3,
                "requires_risk_assessment": True,
                "requires_incident_response": True,
                "requires_continuous_monitoring": True,
                "mandatory_fields": [
                    "security_control",
                    "risk_level",
                    "impact_assessment",
                ],
            },
        }

    def _initialize_alert_rules(self) -> dict[str, dict[str, Any]]:
        """Initialize real-time alerting rules"""
        return {
            "multiple_login_failures": {
                "threshold": 5,
                "window_minutes": 5,
                "severity": AlertSeverity.HIGH,
                "description": "Multiple login failures detected",
                "auto_actions": ["lock_account", "notify_security"],
            },
            "privilege_escalation": {
                "threshold": 1,
                "window_minutes": 1,
                "severity": AlertSeverity.CRITICAL,
                "description": "Privilege escalation detected",
                "auto_actions": ["immediate_review", "notify_admin"],
            },
            "unusual_data_access": {
                "threshold": 50,
                "window_minutes": 10,
                "severity": AlertSeverity.HIGH,
                "description": "Unusual data access pattern detected",
                "auto_actions": ["monitor_session", "require_reauth"],
            },
            "geographic_anomaly": {
                "threshold": 1,
                "window_minutes": 1,
                "severity": AlertSeverity.MEDIUM,
                "description": "Login from unusual geographic location",
                "auto_actions": ["verify_identity", "monitor_session"],
            },
            "off_hours_admin_access": {
                "threshold": 1,
                "window_minutes": 1,
                "severity": AlertSeverity.MEDIUM,
                "description": "Administrative access outside business hours",
                "auto_actions": ["require_justification", "notify_supervisor"],
            },
            "bulk_data_export": {
                "threshold": 1000,
                "window_minutes": 5,
                "severity": AlertSeverity.HIGH,
                "description": "Large volume data export detected",
                "auto_actions": ["pause_export", "require_approval"],
            },
            "security_policy_violation": {
                "threshold": 1,
                "window_minutes": 1,
                "severity": AlertSeverity.HIGH,
                "description": "Security policy violation detected",
                "auto_actions": ["block_action", "notify_security"],
            },
        }

    async def start_enhanced_monitoring(self):
        """Start enhanced monitoring and compliance tasks"""
        self._monitoring_task = asyncio.create_task(
            self._real_time_monitoring_loop()
        )
        self._compliance_task = asyncio.create_task(
            self._compliance_monitoring_loop()
        )
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())

        logger.info("🔍 Enhanced audit monitoring started")

    async def stop_enhanced_monitoring(self):
        """Stop enhanced monitoring tasks"""
        tasks = [
            self._monitoring_task,
            self._compliance_task,
            self._cleanup_task,
        ]
        for task in tasks:
            if task:
                task.cancel()

    async def log_enhanced_event(
        self,
        event_type: AuditEventType,
        action: str,
        outcome: str = "success",
        level: AuditLevel = AuditLevel.LOW,
        resource: str | None = None,
        details: dict[str, Any] | None = None,
        compliance_tags: list[ComplianceStandard] | None = None,
        **kwargs,
    ) -> str:
        """Log event with enhanced compliance and security features"""

        if details is None:
            details = {}

        # Add compliance tags to details
        if compliance_tags:
            details["compliance_standards"] = [
                tag.value for tag in compliance_tags
            ]

            # Add compliance-specific required fields
            for standard in compliance_tags:
                await self._validate_compliance_requirements(standard, details)

        # Add enhanced security context
        details.update(
            await self._get_security_context(kwargs.get("ip_address"))
        )

        # Generate integrity hash
        details["integrity_hash"] = self._generate_event_hash(
            event_type, action, details
        )

        # Log through base logger
        event_id = await self.base_logger.log_event(
            event_type=event_type,
            action=action,
            outcome=outcome,
            level=level,
            resource=resource,
            details=details,
            **kwargs,
        )

        # Enhanced real-time analysis
        await self._analyze_event_for_threats(
            event_type, details, kwargs.get("ip_address")
        )

        # Update user risk profile
        if kwargs.get("user_id"):
            await self._update_user_risk_profile(
                kwargs["user_id"], event_type, details
            )

        return event_id

    async def _validate_compliance_requirements(
        self, standard: ComplianceStandard, details: dict[str, Any]
    ):
        """Validate that event meets compliance requirements"""
        rules = self.compliance_rules.get(standard, {})
        mandatory_fields = rules.get("mandatory_fields", [])

        missing_fields = []
        for field in mandatory_fields:
            if field not in details:
                missing_fields.append(field)

        if missing_fields:
            logger.warning(
                f"Compliance violation for {standard.value}: Missing fields {missing_fields}"
            )
            details["compliance_violations"] = missing_fields

    async def _get_security_context(
        self, ip_address: str | None
    ) -> dict[str, Any]:
        """Get enhanced security context for the event"""
        context = {
            "timestamp_utc": datetime.utcnow().isoformat(),
            "is_business_hours": self._is_business_hours(),
            "session_risk_score": await self._calculate_session_risk(),
        }

        if ip_address:
            context.update(
                {
                    "ip_reputation_score": await self._get_ip_reputation(
                        ip_address
                    ),
                    "is_vpn": await self._check_vpn_usage(ip_address),
                    "geographic_risk": await self._assess_geographic_risk(
                        ip_address
                    ),
                }
            )

        return context

    def _generate_event_hash(
        self, event_type: AuditEventType, action: str, details: dict[str, Any]
    ) -> str:
        """Generate cryptographic hash for event integrity"""
        # Create deterministic string from event data
        hash_data = f"{event_type.value}:{action}:{json.dumps(details, sort_keys=True)}"
        return hashlib.sha256(hash_data.encode()).hexdigest()

    async def _analyze_event_for_threats(
        self,
        event_type: AuditEventType,
        details: dict[str, Any],
        ip_address: str | None,
    ):
        """Real-time threat analysis of audit events"""

        threats_detected = []

        # Analyze login patterns
        if event_type == AuditEventType.LOGIN_FAILURE:
            if await self._detect_brute_force_attack(
                details.get("user_id"), ip_address
            ):
                threats_detected.append("brute_force_attack")

        # Analyze data access patterns
        if event_type == AuditEventType.DATA_ACCESS:
            if await self._detect_unusual_access_pattern(
                details.get("user_id"), details.get("resource")
            ):
                threats_detected.append("unusual_access_pattern")

        # Analyze privilege escalation
        if event_type == AuditEventType.PRIVILEGE_ESCALATION:
            threats_detected.append("privilege_escalation")

        # Generate alerts for detected threats
        for threat in threats_detected:
            await self._generate_security_alert(threat, event_type, details)

    async def _detect_brute_force_attack(
        self, user_id: str | None, ip_address: str | None
    ) -> bool:
        """Detect brute force login attacks"""
        if not user_id and not ip_address:
            return False

        # Check patterns for user or IP
        pattern_keys = []
        if user_id:
            pattern_keys.append(f"login_failures:user:{user_id}")
        if ip_address:
            pattern_keys.append(f"login_failures:ip:{ip_address}")

        for pattern_key in pattern_keys:
            if await self._check_threat_pattern(
                pattern_key, "multiple_login_failures"
            ):
                return True

        return False

    async def _check_threat_pattern(
        self, pattern_key: str, rule_name: str
    ) -> bool:
        """Check if a threat pattern matches configured rules"""
        rule = self.alert_rules.get(rule_name, {})
        threshold = rule.get("threshold", 5)
        window_minutes = rule.get("window_minutes", 5)

        now = datetime.now()
        window_start = now - timedelta(minutes=window_minutes)

        # Initialize or clean pattern history
        if pattern_key not in self.pattern_detectors:
            self.pattern_detectors[pattern_key] = []

        # Remove old events
        self.pattern_detectors[pattern_key] = [
            ts
            for ts in self.pattern_detectors[pattern_key]
            if ts > window_start
        ]

        # Add current event
        self.pattern_detectors[pattern_key].append(now)

        return len(self.pattern_detectors[pattern_key]) >= threshold

    async def _generate_security_alert(
        self,
        threat_type: str,
        event_type: AuditEventType,
        details: dict[str, Any],
    ):
        """Generate and process security alerts"""

        rule = self.alert_rules.get(threat_type, {})

        alert = SecurityAlert(
            alert_id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            severity=rule.get("severity", AlertSeverity.MEDIUM),
            alert_type=threat_type,
            description=rule.get(
                "description", f"Security threat detected: {threat_type}"
            ),
            affected_user=details.get("user_id"),
            affected_resource=details.get("resource"),
            risk_score=details.get("risk_score", 50),
            details=details.copy(),
            actions_taken=[],
        )

        # Execute automatic actions
        auto_actions = rule.get("auto_actions", [])
        for action in auto_actions:
            await self._execute_security_action(action, alert)

        # Store alert
        self.alert_history.append(alert)

        # Log alert
        logger.warning(
            f"🚨 Security Alert [{alert.severity.value.upper()}]: {alert.description}"
        )

        return alert

    async def _execute_security_action(
        self, action: str, alert: SecurityAlert
    ):
        """Execute automatic security actions"""
        try:
            if action == "lock_account" and alert.affected_user:
                # Would integrate with user management system
                alert.actions_taken.append(
                    f"Account {alert.affected_user} temporarily locked"
                )

            elif action == "notify_security":
                # Would send notification to security team
                alert.actions_taken.append("Security team notified")

            elif action == "require_reauth":
                # Would force re-authentication
                alert.actions_taken.append("Re-authentication required")

            elif action == "monitor_session":
                # Would enhance session monitoring
                alert.actions_taken.append(
                    "Enhanced session monitoring enabled"
                )

            elif action == "block_action":
                # Would block the suspicious action
                alert.actions_taken.append("Suspicious action blocked")

            logger.info(
                f"Executed security action: {action} for alert {alert.alert_id}"
            )

        except Exception as e:
            logger.error(f"Failed to execute security action {action}: {e}")

    async def generate_compliance_report(
        self,
        standard: ComplianceStandard,
        start_date: datetime,
        end_date: datetime,
    ) -> ComplianceReport:
        """Generate comprehensive compliance report"""

        rules = self.compliance_rules.get(standard, {})
        required_events = rules.get("required_events", [])

        # Simulate event query (would integrate with actual database)
        events = await self._query_compliance_events(
            standard, start_date, end_date
        )

        # Calculate metrics
        total_events = len(events)
        critical_events = len(
            [e for e in events if e.get("level") == "critical"]
        )
        failed_events = len(
            [e for e in events if e.get("outcome") == "failure"]
        )

        # Calculate coverage
        expected_events = await self._calculate_expected_compliance_events(
            standard, start_date, end_date
        )
        coverage_percentage = min(
            (total_events / expected_events * 100)
            if expected_events > 0
            else 100,
            100,
        )

        # Generate findings
        findings = await self._analyze_compliance_findings(
            standard, events, rules
        )

        # Generate recommendations
        recommendations = self._generate_compliance_recommendations(
            standard, findings, coverage_percentage
        )

        report = ComplianceReport(
            standard=standard,
            period_start=start_date,
            period_end=end_date,
            total_events=total_events,
            critical_events=critical_events,
            failed_events=failed_events,
            coverage_percentage=coverage_percentage,
            findings=findings,
            recommendations=recommendations,
            generated_at=datetime.now(),
            report_id=str(uuid.uuid4()),
        )

        logger.info(
            f"Generated compliance report for {standard.value}: {coverage_percentage:.1f}% coverage"
        )

        return report

    async def get_security_dashboard(self) -> dict[str, Any]:
        """Get real-time security dashboard data"""

        now = datetime.now()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)

        # Recent alerts
        recent_alerts = [
            alert for alert in self.alert_history if alert.timestamp > last_24h
        ]

        # Security metrics
        dashboard = {
            "timestamp": now.isoformat(),
            "alerts": {
                "last_24h": len(recent_alerts),
                "critical_last_24h": len(
                    [
                        a
                        for a in recent_alerts
                        if a.severity == AlertSeverity.CRITICAL
                    ]
                ),
                "by_type": self._group_alerts_by_type(recent_alerts),
            },
            "threat_indicators": {
                "active_patterns": len(self.pattern_detectors),
                "high_risk_users": await self._get_high_risk_users(),
                "suspicious_ips": await self._get_suspicious_ips(),
            },
            "compliance_status": await self._get_compliance_status_summary(),
            "system_health": {
                "audit_events_last_hour": await self._count_recent_events(
                    hours=1
                ),
                "avg_risk_score": await self._get_average_risk_score(last_24h),
                "integrity_violations": await self._count_integrity_violations(
                    last_7d
                ),
            },
        }

        return dashboard

    async def _real_time_monitoring_loop(self):
        """Background task for real-time security monitoring"""
        while True:
            try:
                await asyncio.sleep(60)  # Run every minute

                # Check for emerging threat patterns
                await self._analyze_emerging_patterns()

                # Update risk profiles
                await self._update_risk_profiles()

                # Generate proactive alerts
                await self._generate_proactive_alerts()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Real-time monitoring error: {e}")

    async def _compliance_monitoring_loop(self):
        """Background task for compliance monitoring"""
        while True:
            try:
                await asyncio.sleep(3600)  # Run every hour

                # Check compliance requirements
                await self._check_compliance_requirements()

                # Generate compliance alerts
                await self._check_compliance_violations()

                # Update compliance metrics
                await self._update_compliance_metrics()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Compliance monitoring error: {e}")

    async def _cleanup_loop(self):
        """Background task for cleanup and maintenance"""
        while True:
            try:
                await asyncio.sleep(3600)  # Run every hour

                # Clean old patterns
                self._cleanup_old_patterns()

                # Clean old alerts
                self._cleanup_old_alerts()

                # Clean cache
                self._cleanup_cache()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Cleanup error: {e}")

    def _cleanup_old_patterns(self):
        """Remove old threat detection patterns"""
        cutoff = datetime.now() - timedelta(hours=24)

        for pattern_key in list(self.pattern_detectors.keys()):
            self.pattern_detectors[pattern_key] = [
                ts for ts in self.pattern_detectors[pattern_key] if ts > cutoff
            ]

            if not self.pattern_detectors[pattern_key]:
                del self.pattern_detectors[pattern_key]

    def _cleanup_old_alerts(self):
        """Remove old security alerts"""
        cutoff = datetime.now() - timedelta(days=30)
        self.alert_history = [
            alert for alert in self.alert_history if alert.timestamp > cutoff
        ]

    # Placeholder implementations for helper methods
    def _is_business_hours(self) -> bool:
        """Check if current time is within business hours"""
        now = datetime.now()
        return 9 <= now.hour <= 17 and now.weekday() < 5

    async def _calculate_session_risk(self) -> int:
        """Calculate current session risk score"""
        return 25  # Placeholder

    async def _get_ip_reputation(self, ip_address: str) -> int:
        """Get IP reputation score"""
        return 50  # Placeholder

    async def _check_vpn_usage(self, ip_address: str) -> bool:
        """Check if IP is from VPN"""
        return False  # Placeholder

    async def _assess_geographic_risk(self, ip_address: str) -> int:
        """Assess geographic risk of IP"""
        return 25  # Placeholder

    async def _query_compliance_events(
        self,
        standard: ComplianceStandard,
        start_date: datetime,
        end_date: datetime,
    ) -> list[dict[str, Any]]:
        """Query events for compliance reporting"""
        return []  # Placeholder

    async def _calculate_expected_compliance_events(
        self,
        standard: ComplianceStandard,
        start_date: datetime,
        end_date: datetime,
    ) -> int:
        """Calculate expected number of compliance events"""
        return 100  # Placeholder

    async def _analyze_compliance_findings(
        self,
        standard: ComplianceStandard,
        events: list[dict[str, Any]],
        rules: dict[str, Any],
    ) -> list[dict[str, Any]]:
        """Analyze events for compliance findings"""
        return []  # Placeholder

    def _generate_compliance_recommendations(
        self,
        standard: ComplianceStandard,
        findings: list[dict[str, Any]],
        coverage: float,
    ) -> list[str]:
        """Generate compliance recommendations"""
        recommendations = []

        if coverage < 90:
            recommendations.append(
                f"Increase audit coverage to meet {standard.value} requirements"
            )

        if findings:
            recommendations.append("Address identified compliance gaps")

        return recommendations


# Global enhanced audit system instance
_enhanced_audit_system: EnhancedAuditSystem | None = None


async def get_enhanced_audit_system() -> EnhancedAuditSystem:
    """Get the global enhanced audit system instance"""
    global _enhanced_audit_system
    if _enhanced_audit_system is None:
        from .audit_logger import audit_logger  # Import existing logger

        _enhanced_audit_system = EnhancedAuditSystem(audit_logger)
        await _enhanced_audit_system.start_enhanced_monitoring()
    return _enhanced_audit_system


async def shutdown_enhanced_audit_system():
    """Shutdown the enhanced audit system"""
    global _enhanced_audit_system
    if _enhanced_audit_system:
        await _enhanced_audit_system.stop_enhanced_monitoring()
        _enhanced_audit_system = None
