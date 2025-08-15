"""
Deliverability Schemas
Pydantic models for email deliverability analysis and optimization
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class DeliverabilityAnalysis(BaseModel):
    content_score: float = Field(..., ge=0, le=1)
    subject_score: float = Field(..., ge=0, le=1)
    sender_reputation: float = Field(..., ge=0, le=1)
    overall_score: float = Field(..., ge=0, le=1)
    spam_probability: float = Field(..., ge=0, le=1)
    recommendations: list[str]
    warnings: list[str]


class DomainReputation(BaseModel):
    domain: str
    reputation_score: float = Field(..., ge=0, le=1)
    blacklist_status: dict[str, bool]
    spf_record: str | None = None
    dkim_status: bool
    dmarc_policy: str | None = None


class DeliverabilityMetrics(BaseModel):
    delivery_rate: float = Field(..., ge=0, le=1)
    bounce_rate: float = Field(..., ge=0, le=1)
    open_rate: float = Field(..., ge=0, le=1)
    click_rate: float = Field(..., ge=0, le=1)
    spam_rate: float = Field(..., ge=0, le=1)
    reputation_score: float = Field(..., ge=0, le=1)


class BlacklistCheckRequest(BaseModel):
    domains: list[str] = Field(..., min_items=1, max_items=50)
    ip_addresses: list[str] | None = Field(None, max_items=50)


class BlacklistResult(BaseModel):
    is_blacklisted: bool
    blacklists: dict[str, dict[str, Any]]
    reputation_score: float | None = None


class BlacklistCheckResponse(BaseModel):
    checked_count: int
    blacklisted_count: int
    results: dict[str, BlacklistResult]
    checked_at: datetime


class AuthenticationRecord(BaseModel):
    configured: bool
    valid: bool
    record: str | None = None
    warnings: list[str] = []


class SPFRecord(AuthenticationRecord):
    pass


class DKIMRecord(AuthenticationRecord):
    selector: str | None = None
    key_length: int | None = None


class DMARCRecord(AuthenticationRecord):
    policy: str | None = None
    pct: int | None = None
    rua: str | None = None


class BIMIRecord(AuthenticationRecord):
    pass


class AuthenticationCheckResponse(BaseModel):
    domain: str
    spf: SPFRecord
    dkim: DKIMRecord
    dmarc: DMARCRecord
    bimi: BIMIRecord
    overall_score: float = Field(..., ge=0, le=1)
    recommendations: list[str]


class DeliverabilityRecommendation(BaseModel):
    title: str
    description: str
    impact: str = Field(..., pattern="^(low|medium|high)$")
    effort: str = Field(..., pattern="^(low|medium|high)$")
    category: str | None = None


class RecommendationsResponse(BaseModel):
    priority_recommendations: list[DeliverabilityRecommendation]
    content_recommendations: list[DeliverabilityRecommendation]
    technical_recommendations: list[DeliverabilityRecommendation]


class WarmupPlanRequest(BaseModel):
    domain: str
    daily_volume_target: int = Field(..., gt=0)
    duration_days: int = Field(30, ge=7, le=90)


class WarmupScheduleEntry(BaseModel):
    day: int
    volume: int
    date: str


class WarmupPlanResponse(BaseModel):
    domain: str
    target_volume: int
    duration_days: int
    schedule: list[WarmupScheduleEntry]
    recommendations: list[str]
    created_at: datetime


class InboxPlacementProvider(BaseModel):
    inbox_rate: float = Field(..., ge=0, le=1)
    spam_rate: float = Field(..., ge=0, le=1)
    missing_rate: float = Field(..., ge=0, le=1)


class InboxPlacementData(BaseModel):
    period_days: int
    providers: dict[str, InboxPlacementProvider]
    overall: InboxPlacementProvider
    tested_at: datetime


class BenchmarkMetric(BaseModel):
    average: float
    top_quartile: float
    your_rate: float


class CompetitiveAnalysis(BaseModel):
    industry: str
    benchmarks: dict[str, BenchmarkMetric]
    ranking: str
    improvement_opportunities: list[str]
