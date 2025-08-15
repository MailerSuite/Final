"""
Enhanced Analytics Models for Bulk Checker Operations
Extends existing analytics with comprehensive bulk checking insights and historical tracking
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.sql import func

from models.base import Base

# Extend existing analytics with bulk checker specific models


class BulkCheckJobType(str, Enum):
    """Types of bulk check jobs"""

    SMTP = "smtp"
    IMAP = "imap"


class JobStatus(str, Enum):
    """Status of bulk check jobs"""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class PerformanceTier(str, Enum):
    """Performance tier classification"""

    EXCELLENT = "excellent"  # >80% success rate, high speed
    GOOD = "good"  # 60-80% success rate, medium speed
    FAIR = "fair"  # 40-60% success rate, low speed
    POOR = "poor"  # <40% success rate, very low speed


class BulkCheckJob(Base):
    """Records of bulk check job executions with comprehensive metrics"""

    __tablename__ = "bulk_check_jobs"
    __table_args__ = (
        Index("idx_bulk_jobs_session_type", "session_id", "job_type"),
        Index("idx_bulk_jobs_status_created", "status", "created_at"),
        Index("idx_bulk_jobs_performance", "performance_tier", "success_rate"),
        {"extend_existing": True},
    )

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), nullable=False, index=True)
    celery_task_id = Column(
        String(255), unique=True, nullable=False, index=True
    )
    job_type = Column(String(20), nullable=False)  # smtp, imap
    status = Column(String(20), default=JobStatus.PENDING.value)

    # Job configuration
    total_combos = Column(Integer, nullable=False)
    max_threads = Column(Integer, default=50)
    timeout_seconds = Column(Integer, default=30)
    proxy_enabled = Column(Boolean, default=True)
    inbox_test_enabled = Column(Boolean, default=False)  # SMTP only

    # Execution metrics
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    execution_duration = Column(Float, nullable=True)  # seconds

    # Results summary
    valid_count = Column(Integer, default=0)
    invalid_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)  # percentage
    average_speed = Column(Float, default=0.0)  # checks per second

    # Performance classification
    performance_tier = Column(String(20), nullable=True)

    # Error analysis
    total_errors = Column(Integer, default=0)
    auth_errors = Column(Integer, default=0)
    connection_errors = Column(Integer, default=0)
    timeout_errors = Column(Integer, default=0)
    proxy_errors = Column(Integer, default=0)

    # Proxy usage statistics
    proxies_used = Column(Integer, default=0)
    proxy_success_rate = Column(Float, default=0.0)

    # Additional metadata
    config_snapshot = Column(JSON, nullable=True)
    error_samples = Column(
        JSON, nullable=True
    )  # Sample of errors for analysis

    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Indexes for performance moved to __table_args__ above


class BulkCheckPerformanceSnapshot(Base):
    """Periodic snapshots of bulk checker performance for trend analysis"""

    __tablename__ = "bulk_check_performance_snapshots"
    __table_args__ = (
        Index("idx_perf_snapshot_time_window", "snapshot_time", "time_window"),
        {"extend_existing": True},
    )

    id = Column(Integer, primary_key=True, index=True)
    snapshot_time = Column(DateTime, nullable=False, index=True)

    # Time window for this snapshot (e.g., '1h', '24h', '7d')
    time_window = Column(String(10), nullable=False)

    # SMTP metrics
    smtp_total_jobs = Column(Integer, default=0)
    smtp_successful_jobs = Column(Integer, default=0)
    smtp_avg_success_rate = Column(Float, default=0.0)
    smtp_avg_speed = Column(Float, default=0.0)
    smtp_total_checks = Column(Integer, default=0)
    smtp_valid_checks = Column(Integer, default=0)

    # IMAP metrics
    imap_total_jobs = Column(Integer, default=0)
    imap_successful_jobs = Column(Integer, default=0)
    imap_avg_success_rate = Column(Float, default=0.0)
    imap_avg_speed = Column(Float, default=0.0)
    imap_total_checks = Column(Integer, default=0)
    imap_valid_checks = Column(Integer, default=0)

    # System-wide metrics
    total_active_sessions = Column(Integer, default=0)
    proxy_utilization_rate = Column(Float, default=0.0)
    avg_job_duration = Column(Float, default=0.0)

    # Error rates
    overall_error_rate = Column(Float, default=0.0)
    auth_error_rate = Column(Float, default=0.0)
    connection_error_rate = Column(Float, default=0.0)
    proxy_error_rate = Column(Float, default=0.0)

    # Performance distribution
    excellent_jobs_pct = Column(Float, default=0.0)
    good_jobs_pct = Column(Float, default=0.0)
    fair_jobs_pct = Column(Float, default=0.0)
    poor_jobs_pct = Column(Float, default=0.0)

    created_at = Column(DateTime, server_default=func.now())

    # Indexes moved to __table_args__ above


class SessionAnalytics(Base):
    """Analytics aggregated by session for user insights"""

    __tablename__ = "session_analytics"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), nullable=False, unique=True, index=True)

    # Session summary
    first_activity = Column(DateTime, nullable=True)
    last_activity = Column(DateTime, nullable=True)
    total_jobs = Column(Integer, default=0)
    successful_jobs = Column(Integer, default=0)

    # Cumulative metrics
    total_checks_performed = Column(Integer, default=0)
    total_valid_credentials = Column(Integer, default=0)
    total_invalid_credentials = Column(Integer, default=0)
    total_errors = Column(Integer, default=0)

    # Performance metrics
    best_success_rate = Column(Float, default=0.0)
    avg_success_rate = Column(Float, default=0.0)
    best_speed = Column(Float, default=0.0)  # checks per second
    avg_speed = Column(Float, default=0.0)

    # Usage patterns
    preferred_job_type = Column(String(20), nullable=True)  # smtp or imap
    avg_batch_size = Column(Integer, default=0)
    proxy_usage_rate = Column(Float, default=0.0)

    # Time-based analysis
    most_active_hour = Column(Integer, nullable=True)  # 0-23
    most_active_day = Column(Integer, nullable=True)  # 0-6 (Monday=0)
    avg_session_duration = Column(Float, default=0.0)  # minutes

    # Quality metrics
    data_quality_score = Column(
        Float, default=0.0
    )  # Based on error rates, consistency
    efficiency_score = Column(Float, default=0.0)  # Speed vs. accuracy balance

    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )


class ErrorPatternAnalysis(Base):
    """Analysis of error patterns for insights and recommendations"""

    __tablename__ = "error_pattern_analysis"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    analysis_date = Column(DateTime, nullable=False, index=True)

    # Pattern identification
    error_category = Column(String(50), nullable=False)
    error_pattern = Column(Text, nullable=False)
    frequency = Column(Integer, default=0)

    # Context
    job_type = Column(
        String(20), nullable=True
    )  # smtp, imap, or null for both
    session_count = Column(Integer, default=0)  # How many sessions affected

    # Impact analysis
    success_rate_impact = Column(Float, default=0.0)  # Percentage points
    speed_impact = Column(Float, default=0.0)  # Performance degradation

    # Recommendations
    suggested_fix = Column(Text, nullable=True)
    confidence_score = Column(Float, default=0.0)  # 0-1

    # Resolution tracking
    is_resolved = Column(Boolean, default=False)
    resolution_date = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now())


class ProxyPerformanceAnalytics(Base):
    """Analytics for proxy server performance and reliability"""

    __tablename__ = "proxy_performance_analytics"
    __table_args__ = (
        Index("idx_proxy_analytics_host_port", "proxy_host", "proxy_port"),
        Index(
            "idx_proxy_analytics_performance", "overall_score", "analysis_date"
        ),
        {"extend_existing": True},
    )

    id = Column(Integer, primary_key=True, index=True)
    analysis_date = Column(DateTime, nullable=False, index=True)

    # Proxy identification
    proxy_host = Column(String(255), nullable=False)
    proxy_port = Column(Integer, nullable=False)
    proxy_type = Column(String(20), default="socks5")

    # Usage metrics
    total_connections = Column(Integer, default=0)
    successful_connections = Column(Integer, default=0)
    failed_connections = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)

    # Performance metrics
    avg_connection_time = Column(Float, default=0.0)  # seconds
    avg_response_time = Column(Float, default=0.0)
    uptime_percentage = Column(Float, default=0.0)

    # Geographic/Network analysis
    estimated_location = Column(String(100), nullable=True)
    network_provider = Column(String(100), nullable=True)

    # Quality scoring
    reliability_score = Column(Float, default=0.0)  # 0-100
    speed_score = Column(Float, default=0.0)  # 0-100
    overall_score = Column(Float, default=0.0)  # 0-100

    # Recommendations
    recommended_for_job_type = Column(String(20), nullable=True)
    max_concurrent_recommended = Column(Integer, nullable=True)

    created_at = Column(DateTime, server_default=func.now())

    # Indexes moved to __table_args__ above


# Data classes for analytics responses
@dataclass
class PerformanceTrend:
    """Performance trend data"""

    timestamp: datetime
    success_rate: float
    throughput: float
    error_rate: float
    active_jobs: int


@dataclass
class SessionInsight:
    """Insights for a specific session"""

    session_id: str
    performance_tier: PerformanceTier
    total_checks: int
    success_rate: float
    recommendations: list[str]
    trends: list[PerformanceTrend]


@dataclass
class SystemHealthInsight:
    """Overall system health insights"""

    overall_health: str
    success_rate_trend: str  # improving, stable, declining
    throughput_trend: str
    top_error_categories: list[dict[str, Any]]
    proxy_health: dict[str, Any]
    recommendations: list[str]


@dataclass
class AnalyticsSummary:
    """Comprehensive analytics summary"""

    time_period: str
    total_jobs: int
    total_checks: int
    overall_success_rate: float
    smtp_analytics: dict[str, Any]
    imap_analytics: dict[str, Any]
    performance_distribution: dict[str, float]
    top_performing_sessions: list[str]
    improvement_opportunities: list[str]


# Add relationships to existing models if needed
# This would extend the existing analytics models


def calculate_performance_tier(
    success_rate: float, speed: float
) -> PerformanceTier:
    """Calculate performance tier based on success rate and speed"""
    if success_rate >= 80 and speed >= 25:
        return PerformanceTier.EXCELLENT
    elif success_rate >= 60 and speed >= 15:
        return PerformanceTier.GOOD
    elif success_rate >= 40 and speed >= 5:
        return PerformanceTier.FAIR
    else:
        return PerformanceTier.POOR


def generate_recommendations(analytics_data: dict[str, Any]) -> list[str]:
    """Generate recommendations based on analytics data"""
    recommendations = []

    success_rate = analytics_data.get("success_rate", 0)
    error_rate = analytics_data.get("error_rate", 0)
    proxy_errors = analytics_data.get("proxy_errors", 0)
    auth_errors = analytics_data.get("auth_errors", 0)

    if success_rate < 50:
        recommendations.append(
            "Consider reviewing combo list quality - low success rate detected"
        )

    if error_rate > 30:
        recommendations.append(
            "High error rate detected - review network connectivity and proxy configuration"
        )

    if proxy_errors > 20:
        recommendations.append(
            "Proxy issues detected - consider updating proxy list or reducing concurrent connections"
        )

    if auth_errors > 40:
        recommendations.append(
            "High authentication failure rate - combo list may contain outdated credentials"
        )

    if analytics_data.get("speed", 0) < 10:
        recommendations.append(
            "Low throughput detected - consider increasing thread count or optimizing network settings"
        )

    return recommendations
