"""
IMAP Test Models
Models for IMAP testing functionality including login logs, metrics, and test states.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from sqlalchemy import Column, DateTime, Integer, String, Text, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from models.base import Base


class IMAPTestState(str, Enum):
    """IMAP test states."""
    IDLE = "idle"
    RUNNING = "running"
    STOPPED = "stopped"
    COMPLETED = "completed"
    FAILED = "failed"


class IMAPLoginLog(Base):
    """IMAP login attempt log."""
    __tablename__ = "imap_login_logs"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    test_metrics_id = Column(Integer, ForeignKey("imap_test_metrics.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    success = Column(Boolean, nullable=False)
    response = Column(Text, nullable=True)
    server = Column(String(255), nullable=True)
    port = Column(Integer, nullable=True)
    email = Column(String(255), nullable=True)
    latency_ms = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<IMAPLoginLog(id={self.id}, success={self.success}, timestamp={self.timestamp})>"


class IMAPTestMetrics(Base):
    """IMAP test metrics and statistics."""
    __tablename__ = "imap_test_metrics"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(String(255), unique=True, index=True, nullable=False)
    state = Column(String(50), default=IMAPTestState.IDLE, nullable=False)
    start_time = Column(DateTime, nullable=True)
    stop_time = Column(DateTime, nullable=True)
    attempts = Column(Integer, default=0, nullable=False)
    successes = Column(Integer, default=0, nullable=False)
    failures = Column(Integer, default=0, nullable=False)
    total_latency_ms = Column(Float, default=0.0, nullable=False)
    avg_latency_ms = Column(Float, default=0.0, nullable=False)
    min_latency_ms = Column(Float, nullable=True)
    max_latency_ms = Column(Float, nullable=True)
    stop_reason = Column(String(255), nullable=True)
    error_rate = Column(Float, default=0.0, nullable=False)
    success_rate = Column(Float, default=0.0, nullable=False)
    server = Column(String(255), nullable=True)
    port = Column(Integer, nullable=True)
    email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship to login logs
    login_logs = relationship("IMAPLoginLog", backref="test_metrics")

    def __repr__(self):
        return f"<IMAPTestMetrics(id={self.id}, test_id={self.test_id}, state={self.state})>"

    @property
    def duration_seconds(self) -> Optional[float]:
        """Get test duration in seconds."""
        if self.start_time and self.stop_time:
            return (self.stop_time - self.start_time).total_seconds()
        return None

    def update_metrics(self, success: bool, latency_ms: float):
        """Update metrics with new test result."""
        self.attempts += 1
        if success:
            self.successes += 1
        else:
            self.failures += 1
        
        self.total_latency_ms += latency_ms
        self.avg_latency_ms = self.total_latency_ms / self.attempts
        
        if self.min_latency_ms is None or latency_ms < self.min_latency_ms:
            self.min_latency_ms = latency_ms
        
        if self.max_latency_ms is None or latency_ms > self.max_latency_ms:
            self.max_latency_ms = latency_ms
        
        if self.attempts > 0:
            self.error_rate = (self.failures / self.attempts) * 100
            self.success_rate = (self.successes / self.attempts) * 100


class IMAPTestConfig(Base):
    """IMAP test configuration."""
    __tablename__ = "imap_test_configs"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    server = Column(String(255), nullable=False)
    port = Column(Integer, nullable=False)
    email = Column(String(255), nullable=False)
    password = Column(String(255), nullable=False)
    max_duration_seconds = Column(Integer, default=300, nullable=False)
    max_attempts = Column(Integer, default=1000, nullable=False)
    max_error_rate = Column(Float, default=10.0, nullable=False)
    min_success_rate = Column(Float, default=50.0, nullable=False)
    interval_seconds = Column(Float, default=1.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<IMAPTestConfig(id={self.id}, name={self.name}, server={self.server})>"


# Pydantic models for API responses
from pydantic import BaseModel, Field
from typing import List, Optional


class IMAPLoginLogResponse(BaseModel):
    """IMAP login log response model."""
    id: int
    timestamp: datetime
    success: bool
    response: Optional[str] = None
    server: Optional[str] = None
    port: Optional[int] = None
    email: Optional[str] = None
    latency_ms: Optional[float] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class IMAPTestMetricsResponse(BaseModel):
    """IMAP test metrics response model."""
    id: int
    test_id: str
    state: str
    start_time: Optional[datetime] = None
    stop_time: Optional[datetime] = None
    attempts: int
    successes: int
    failures: int
    total_latency_ms: float
    avg_latency_ms: float
    min_latency_ms: Optional[float] = None
    max_latency_ms: Optional[float] = None
    stop_reason: Optional[str] = None
    error_rate: float
    success_rate: float
    server: Optional[str] = None
    port: Optional[int] = None
    email: Optional[str] = None
    duration_seconds: Optional[float] = None

    class Config:
        from_attributes = True


class IMAPTestConfigResponse(BaseModel):
    """IMAP test configuration response model."""
    id: int
    name: str
    server: str
    port: int
    email: str
    max_duration_seconds: int
    max_attempts: int
    max_error_rate: float
    min_success_rate: float
    interval_seconds: float
    is_active: bool

    class Config:
        from_attributes = True


class IMAPTestRequest(BaseModel):
    """IMAP test request model."""
    server: str = Field(..., description="IMAP server hostname")
    port: int = Field(..., description="IMAP server port")
    email: str = Field(..., description="Email address")
    password: str = Field(..., description="Email password")
    max_duration_seconds: int = Field(300, description="Maximum test duration in seconds")
    max_attempts: int = Field(1000, description="Maximum number of attempts")
    max_error_rate: float = Field(10.0, description="Maximum error rate percentage")
    min_success_rate: float = Field(50.0, description="Minimum success rate percentage")
    interval_seconds: float = Field(1.0, description="Interval between attempts in seconds")


class IMAPTestStatusResponse(BaseModel):
    """IMAP test status response model."""
    test_id: str
    state: str
    is_running: bool
    attempts: int
    successes: int
    failures: int
    error_rate: float
    success_rate: float
    avg_latency_ms: float
    duration_seconds: Optional[float] = None
    stop_reason: Optional[str] = None
    server: str
    port: int
    email: str 