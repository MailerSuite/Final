from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class StopConditionBase(BaseModel):
    """Base fields for a stop condition."""

    type: Literal["error_rate", "success_rate", "duration", "total_tests"] = (
        Field(
            ..., description="Metric type to evaluate", examples=["error_rate"]
        )
    )
    operator: Literal["<", "<=", ">", ">="] = Field(
        ..., description="Comparison operator", examples=[">"]
    )
    value: float = Field(..., description="Threshold value", examples=[10])
    enabled: bool = Field(True, description="Whether the condition is active")


class StopConditionCreate(StopConditionBase):
    pass


class StopConditionUpdate(BaseModel):
    """Fields for updating a stop condition."""

    type: Literal["error_rate", "success_rate", "duration", "total_tests"] | None = Field(
        None, description="Metric type to evaluate", examples=["error_rate"]
    )
    operator: Literal["<", "<=", ">", ">="] | None = Field(
        None, description="Comparison operator", examples=[">"]
    )
    value: float | None = Field(
        None, description="Threshold value", examples=[10]
    )
    enabled: bool | None = Field(
        None, description="Whether the condition is active"
    )


class StopCondition(StopConditionBase):
    id: UUID = Field(default_factory=uuid4)
    model_config = ConfigDict(from_attributes=True)


class EvaluateMetrics(BaseModel):
    error_rate: float = Field(..., examples=[5])
    success_rate: float = Field(..., examples=[95])
    duration: float = Field(..., examples=[30])
    total_tests: int = Field(..., examples=[100])


class EvaluateResponse(BaseModel):
    stop: bool
    reason: str | None = None
