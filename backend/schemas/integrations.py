"""
Integration Schemas
Pydantic models for integration management API validation
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, validator

# ===== ENUMS =====


class IntegrationCategory(str, Enum):
    crm = "crm"
    ecommerce = "ecommerce"
    analytics = "analytics"
    marketing = "marketing"


class AuthType(str, Enum):
    oauth2 = "oauth2"
    api_key = "api_key"
    basic_auth = "basic_auth"
    webhook = "webhook"


class IntegrationStatus(str, Enum):
    active = "active"
    paused = "paused"
    error = "error"
    disconnected = "disconnected"


class SyncDirection(str, Enum):
    inbound = "inbound"
    outbound = "outbound"
    bidirectional = "bidirectional"


class SyncType(str, Enum):
    manual = "manual"
    scheduled = "scheduled"
    webhook = "webhook"
    real_time = "real_time"


class SyncStatus(str, Enum):
    started = "started"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


# ===== INTEGRATION PROVIDER SCHEMAS =====


class IntegrationProviderResponse(BaseModel):
    id: str
    name: str
    display_name: str
    description: str | None
    category: str
    auth_type: str
    auth_config: dict[str, Any]
    api_base_url: str | None
    api_version: str | None
    supported_actions: list[str]
    supported_data_types: list[str]
    webhook_support: bool
    real_time_sync: bool
    config_schema: dict[str, Any]
    required_fields: list[str]
    logo_url: str | None
    documentation_url: str | None
    setup_instructions: str | None
    is_active: bool
    is_premium: bool
    plan_requirements: dict[str, Any] | None
    usage_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== INTEGRATION SCHEMAS =====


class IntegrationCreate(BaseModel):
    provider_id: str = Field(..., description="ID of the integration provider")
    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="User-defined name for the integration",
    )
    description: str | None = Field(
        None, description="Optional description"
    )
    auth_data: dict[str, Any] = Field(
        ..., description="Authentication data (API keys, tokens, etc.)"
    )
    config: dict[str, Any] = Field(
        default_factory=dict, description="Integration-specific configuration"
    )
    field_mappings: dict[str, Any] = Field(
        default_factory=dict, description="Field mapping configuration"
    )
    sync_settings: dict[str, Any] = Field(
        default_factory=dict, description="Sync frequency, filters, etc."
    )
    sync_frequency: str = Field(default="manual", description="Sync frequency")
    tags: list[str] | None = Field(None, description="User-defined tags")
    notes: str | None = Field(None, description="Additional notes")

    @validator("sync_frequency")
    def validate_sync_frequency(cls, v):
        valid_frequencies = ["manual", "hourly", "daily", "weekly"]
        if v not in valid_frequencies:
            raise ValueError(
                f"sync_frequency must be one of: {valid_frequencies}"
            )
        return v


class IntegrationUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    auth_data: dict[str, Any] | None = None
    config: dict[str, Any] | None = None
    field_mappings: dict[str, Any] | None = None
    sync_settings: dict[str, Any] | None = None
    status: IntegrationStatus | None = None
    sync_frequency: str | None = None
    tags: list[str] | None = None
    notes: str | None = None

    @validator("sync_frequency")
    def validate_sync_frequency(cls, v):
        if v is not None:
            valid_frequencies = ["manual", "hourly", "daily", "weekly"]
            if v not in valid_frequencies:
                raise ValueError(
                    f"sync_frequency must be one of: {valid_frequencies}"
                )
        return v


class IntegrationResponse(BaseModel):
    id: str
    session_id: str
    provider_id: str
    name: str
    description: str | None
    status: str
    last_sync_at: datetime | None
    last_error: str | None
    sync_frequency: str
    total_syncs: int
    successful_syncs: int
    failed_syncs: int
    last_sync_duration: float | None
    records_synced: int
    webhook_url: str | None
    webhook_events: list[str] | None
    tags: list[str] | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    provider: IntegrationProviderResponse | None = None

    class Config:
        from_attributes = True


# ===== SYNC OPERATION SCHEMAS =====


class IntegrationSyncRequest(BaseModel):
    sync_direction: SyncDirection = Field(
        ..., description="Direction of sync operation"
    )
    data_type: str = Field(
        ..., description="Type of data to sync (contacts, leads, orders, etc.)"
    )
    sync_type: SyncType | None = Field(
        default=SyncType.manual, description="Type of sync trigger"
    )
    filters: dict[str, Any] | None = Field(
        None, description="Filters to apply during sync"
    )
    options: dict[str, Any] | None = Field(
        None, description="Additional sync options"
    )


class IntegrationSyncResponse(BaseModel):
    sync_id: str
    status: str
    message: str
    started_at: datetime | None = None


class SyncLogResponse(BaseModel):
    id: str
    integration_id: str
    sync_type: str
    sync_direction: str
    data_type: str
    status: str
    started_at: datetime
    completed_at: datetime | None
    duration: float | None
    records_processed: int
    records_created: int
    records_updated: int
    records_deleted: int
    records_failed: int
    error_message: str | None
    sync_summary: dict[str, Any] | None

    class Config:
        from_attributes = True


# ===== FIELD MAPPING SCHEMAS =====


class FieldMapCreate(BaseModel):
    source_field: str = Field(..., description="MailerSuite field name")
    target_field: str = Field(..., description="External platform field name")
    field_type: str = Field(..., description="Field data type")
    sync_direction: SyncDirection = Field(default=SyncDirection.bidirectional)
    is_required: bool = Field(default=False)
    is_unique: bool = Field(default=False)
    transform_rules: dict[str, Any] | None = Field(
        None, description="Data transformation rules"
    )
    default_value: str | None = Field(
        None, description="Default value if field is empty"
    )
    validation_rules: dict[str, Any] | None = Field(
        None, description="Validation rules"
    )


class FieldMapUpdate(BaseModel):
    source_field: str | None = None
    target_field: str | None = None
    field_type: str | None = None
    sync_direction: SyncDirection | None = None
    is_required: bool | None = None
    is_unique: bool | None = None
    transform_rules: dict[str, Any] | None = None
    default_value: str | None = None
    validation_rules: dict[str, Any] | None = None
    is_active: bool | None = None


class FieldMapResponse(BaseModel):
    id: str
    integration_id: str
    source_field: str
    target_field: str
    field_type: str
    sync_direction: str
    is_required: bool
    is_unique: bool
    transform_rules: dict[str, Any] | None
    default_value: str | None
    validation_rules: dict[str, Any] | None
    is_active: bool
    last_used_at: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== WEBHOOK SCHEMAS =====


class WebhookCreate(BaseModel):
    endpoint_url: str = Field(..., description="Webhook endpoint URL")
    secret_key: str = Field(
        ..., description="Secret key for webhook verification"
    )
    events: list[str] = Field(..., description="Events to listen for")
    http_method: str = Field(default="POST", description="HTTP method")
    headers: dict[str, str] | None = Field(
        None, description="Custom headers"
    )
    payload_format: str = Field(default="json", description="Payload format")
    verify_ssl: bool = Field(
        default=True, description="Whether to verify SSL certificates"
    )
    ip_whitelist: list[str] | None = Field(
        None, description="Allowed IP addresses"
    )
    max_retries: int = Field(default=3, description="Maximum retry attempts")
    retry_delay: int = Field(
        default=60, description="Delay between retries in seconds"
    )
    timeout: int = Field(default=30, description="Request timeout in seconds")


class WebhookUpdate(BaseModel):
    endpoint_url: str | None = None
    secret_key: str | None = None
    events: list[str] | None = None
    http_method: str | None = None
    headers: dict[str, str] | None = None
    payload_format: str | None = None
    verify_ssl: bool | None = None
    ip_whitelist: list[str] | None = None
    is_active: bool | None = None
    max_retries: int | None = None
    retry_delay: int | None = None
    timeout: int | None = None


class WebhookResponse(BaseModel):
    id: str
    integration_id: str
    endpoint_url: str
    events: list[str]
    http_method: str
    headers: dict[str, str] | None
    payload_format: str
    verify_ssl: bool
    ip_whitelist: list[str] | None
    is_active: bool
    last_triggered_at: datetime | None
    total_triggers: int
    successful_triggers: int
    failed_triggers: int
    max_retries: int
    retry_delay: int
    timeout: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== TEMPLATE SCHEMAS =====


class IntegrationTemplateResponse(BaseModel):
    id: str
    name: str
    description: str | None
    category: str
    use_case: str
    provider_requirements: list[str]
    field_mappings: dict[str, Any]
    sync_settings: dict[str, Any]
    webhook_events: list[str] | None
    difficulty_level: str
    estimated_setup_time: int | None
    tags: list[str] | None
    icon: str | None
    documentation_url: str | None
    tutorial_url: str | None
    usage_count: int
    rating: float | None
    is_active: bool
    is_featured: bool
    is_premium: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== CONNECTION TEST SCHEMAS =====


class ConnectionTestResponse(BaseModel):
    success: bool
    message: str
    error: str | None = None
    response_time: float | None = None
    details: dict[str, Any] | None = None


# ===== BULK OPERATION SCHEMAS =====


class BulkSyncRequest(BaseModel):
    integration_ids: list[str] = Field(..., min_items=1, max_items=10)
    sync_direction: SyncDirection
    data_type: str
    options: dict[str, Any] | None = None


class BulkSyncResponse(BaseModel):
    total_integrations: int
    successful_syncs: int
    failed_syncs: int
    sync_ids: list[str]
    errors: list[dict[str, str]]


# ===== INTEGRATION STATISTICS SCHEMAS =====


class IntegrationStatsResponse(BaseModel):
    total_integrations: int
    active_integrations: int
    failed_integrations: int
    total_syncs_today: int
    successful_syncs_today: int
    failed_syncs_today: int
    avg_sync_duration: float | None
    most_used_providers: list[dict[str, Any]]
    recent_errors: list[dict[str, Any]]


# ===== PROVIDER SETUP SCHEMAS =====


class ProviderSetupRequest(BaseModel):
    provider_id: str
    name: str
    auth_data: dict[str, Any]
    config: dict[str, Any] | None = None
    test_connection: bool = Field(
        default=True, description="Whether to test connection after setup"
    )


class ProviderSetupResponse(BaseModel):
    integration_id: str
    setup_successful: bool
    connection_test_passed: bool
    message: str
    next_steps: list[str]
    field_mapping_suggestions: list[dict[str, Any]] | None = None
