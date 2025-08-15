"""
AI/ML Schemas
Pydantic models for AI and machine learning API endpoints
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class ModelType(str, Enum):
    """AI model type enumeration"""

    TEXT_GENERATION = "text_generation"
    TEXT_ANALYSIS = "text_analysis"
    IMAGE_GENERATION = "image_generation"
    CODE_GENERATION = "code_generation"


class AnalysisType(str, Enum):
    """AI analysis type enumeration"""

    SENTIMENT = "sentiment"
    KEYWORDS = "keywords"
    SUMMARIZATION = "summarization"
    TRANSLATION = "translation"
    GRAMMAR_CHECK = "grammar_check"
    TONE_ANALYSIS = "tone_analysis"


class AIModel(BaseModel):
    """AI model information"""

    id: str
    name: str
    description: str
    type: ModelType
    is_available: bool
    max_tokens: int
    cost_per_token: float
    provider: str | None = None
    version: str | None = None


class AIModelResponse(BaseModel):
    """AI model response wrapper"""

    model: AIModel
    status: str
    message: str | None = None


class AIChatRequest(BaseModel):
    """AI chat request"""

    model_id: str
    message: str
    system_prompt: str | None = None
    temperature: float | None = Field(0.7, ge=0.0, le=2.0)
    max_tokens: int | None = Field(1000, ge=1, le=8192)
    stream: bool = False


class AIChatResponse(BaseModel):
    """AI chat response"""

    model_id: str
    message: str
    tokens_used: int
    cost: float
    timestamp: datetime
    finish_reason: str | None = None


class AIAnalysisRequest(BaseModel):
    """AI analysis request"""

    analysis_type: AnalysisType
    content: str
    model_id: str | None = None
    options: dict[str, Any] | None = None


class AIAnalysisResponse(BaseModel):
    """AI analysis response"""

    analysis_type: AnalysisType
    content: str
    results: dict[str, Any]
    timestamp: datetime
    model_used: str | None = None
    confidence: float | None = None


class AIModelConfig(BaseModel):
    """AI model configuration"""

    default_model: str
    max_tokens_per_request: int
    temperature: float
    enable_streaming: bool
    rate_limit_per_minute: int
    cost_limit_per_day: float
    allowed_models: list[str] | None = None


class AIModelMetrics(BaseModel):
    """AI model usage metrics"""

    total_requests: int
    successful_requests: int
    failed_requests: int
    average_response_time: float
    total_cost: float
    tokens_used: int
    last_updated: datetime
    model_breakdown: dict[str, int] | None = None


class AIConversation(BaseModel):
    """AI conversation history"""

    id: str
    user_id: int
    model_id: str
    messages: list[dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    total_tokens: int
    total_cost: float


class AIConversationCreate(BaseModel):
    """AI conversation creation"""

    model_id: str
    initial_message: str | None = None


class AIConversationMessage(BaseModel):
    """AI conversation message"""

    role: str
    content: str
    timestamp: datetime
    tokens_used: int | None = None
    cost: float | None = None
