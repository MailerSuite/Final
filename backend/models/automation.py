"""
Automation and Workflow Models
Handles drip campaigns, behavioral triggers, and email automation
"""

import enum
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy import (
    UUID as SQLAlchemyUUID,
)
from sqlalchemy.orm import relationship

from models.base import Base, TimestampMixin, get_uuid_column


class TriggerType(enum.Enum):
    """Types of automation triggers"""

    TIME_BASED = "time_based"  # Scheduled triggers
    EVENT_BASED = "event_based"  # User action triggers
    BEHAVIOR_BASED = "behavior_based"  # Engagement-based triggers
    DATE_BASED = "date_based"  # Anniversary, birthday, etc.
    CONDITION_BASED = "condition_based"  # Rule-based triggers


class ActionType(enum.Enum):
    """Types of automation actions"""

    SEND_EMAIL = "send_email"
    WAIT = "wait"
    ADD_TAG = "add_tag"
    REMOVE_TAG = "remove_tag"
    UPDATE_FIELD = "update_field"
    MOVE_TO_LIST = "move_to_list"
    REMOVE_FROM_LIST = "remove_from_list"
    WEBHOOK = "webhook"
    CONDITIONAL = "conditional"
    STOP_WORKFLOW = "stop_workflow"


class WorkflowStatus(enum.Enum):
    """Workflow execution status"""

    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    STOPPED = "stopped"
    ERROR = "error"


class AutomationWorkflow(Base, TimestampMixin):
    """Defines automation workflows and drip campaigns"""

    __tablename__ = "automation_workflows"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()

    # Basic information
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    # Configuration
    trigger_type = Column(String(30), nullable=False)  # TriggerType enum
    trigger_config = Column(
        JSON, nullable=False
    )  # Trigger-specific configuration

    # Status and control
    status = Column(
        String(20), default="draft", nullable=False
    )  # WorkflowStatus enum
    is_active = Column(Boolean, default=False, nullable=False)

    # Execution settings
    max_executions = Column(Integer, nullable=True)  # Null = unlimited
    execution_window_start = Column(String(5), nullable=True)  # "09:00"
    execution_window_end = Column(String(5), nullable=True)  # "17:00"
    timezone = Column(String(50), default="UTC", nullable=False)

    # Segmentation and targeting
    target_segments = Column(JSON, nullable=True)  # List of segment criteria
    exclusion_criteria = Column(JSON, nullable=True)  # Exclusion rules

    # Performance tracking
    total_entries = Column(Integer, default=0, nullable=False)
    completed_executions = Column(Integer, default=0, nullable=False)
    failed_executions = Column(Integer, default=0, nullable=False)

    # Timing
    last_executed_at = Column(DateTime, nullable=True)
    next_execution_at = Column(DateTime, nullable=True)

    # Metadata
    tags = Column(JSON, nullable=True)  # Workflow tags
    workflow_metadata = Column(JSON, nullable=True)

    # Relationships
    actions = relationship(
        "WorkflowAction",
        back_populates="workflow",
        cascade="all, delete-orphan",
    )
    executions = relationship("WorkflowExecution", back_populates="workflow")


class WorkflowAction(Base, TimestampMixin):
    """Individual actions within a workflow"""

    __tablename__ = "workflow_actions"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()
    workflow_id = Column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("automation_workflows.id"),
        nullable=False,
    )

    # Action details
    action_type = Column(String(30), nullable=False)  # ActionType enum
    action_config = Column(
        JSON, nullable=False
    )  # Action-specific configuration

    # Sequencing
    sequence_order = Column(Integer, nullable=False)
    parent_action_id = Column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("workflow_actions.id"),
        nullable=True,
    )  # For branching

    # Timing
    delay_amount = Column(Integer, nullable=True)  # Delay in minutes
    delay_type = Column(
        String(20), nullable=True
    )  # "minutes", "hours", "days", "weeks"

    # Conditions
    conditions = Column(JSON, nullable=True)  # Conditional logic

    # Email-specific settings (for SEND_EMAIL actions)
    email_template_id = Column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("email_templates.id"),
        nullable=True,
    )
    subject_line = Column(String(500), nullable=True)
    email_content = Column(Text, nullable=True)

    # Performance tracking
    execution_count = Column(Integer, default=0, nullable=False)
    success_count = Column(Integer, default=0, nullable=False)
    failure_count = Column(Integer, default=0, nullable=False)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Metadata
    notes = Column(Text, nullable=True)
    action_metadata = Column(JSON, nullable=True)

    # Relationships
    workflow = relationship("AutomationWorkflow", back_populates="actions")
    parent_action = relationship("WorkflowAction", remote_side=[id])
    email_template = relationship(
        "EmailTemplate", foreign_keys=[email_template_id]
    )


class WorkflowExecution(Base, TimestampMixin):
    """Tracks individual workflow executions for users"""

    __tablename__ = "workflow_executions"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()

    # Execution details
    workflow_id = Column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("automation_workflows.id"),
        nullable=False,
    )
    contact_email = Column(String(255), nullable=False, index=True)

    # Status tracking
    status = Column(String(20), nullable=False)  # WorkflowStatus enum
    current_action_id = Column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("workflow_actions.id"),
        nullable=True,
    )
    next_action_id = Column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("workflow_actions.id"),
        nullable=True,
    )

    # Timing
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    next_execution_at = Column(DateTime, nullable=True)

    # Progress tracking
    actions_completed = Column(Integer, default=0, nullable=False)
    total_actions = Column(Integer, nullable=False)
    completion_percentage = Column(Float, default=0.0, nullable=False)

    # Error handling
    last_error = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)

    # Context data
    execution_context = Column(
        JSON, nullable=True
    )  # Dynamic data for the execution

    # Performance metrics
    emails_sent = Column(Integer, default=0, nullable=False)
    emails_opened = Column(Integer, default=0, nullable=False)
    emails_clicked = Column(Integer, default=0, nullable=False)

    # Metadata
    execution_metadata = Column(JSON, nullable=True)

    # Relationships
    workflow = relationship("AutomationWorkflow", back_populates="executions")
    current_action = relationship(
        "WorkflowAction", foreign_keys=[current_action_id]
    )
    next_action = relationship("WorkflowAction", foreign_keys=[next_action_id])


class WorkflowTrigger(Base, TimestampMixin):
    """Tracks when workflows are triggered"""

    __tablename__ = "workflow_triggers"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()

    # Trigger details
    workflow_id = Column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("automation_workflows.id"),
        nullable=False,
    )
    contact_email = Column(String(255), nullable=False, index=True)

    # Trigger source
    trigger_source = Column(
        String(50), nullable=False
    )  # "api", "event", "schedule", "manual"
    trigger_event = Column(
        String(100), nullable=True
    )  # Specific event that triggered
    trigger_data = Column(JSON, nullable=True)  # Additional trigger data

    # Processing
    processed = Column(Boolean, default=False, nullable=False)
    processed_at = Column(DateTime, nullable=True)

    # Result
    execution_id = Column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("workflow_executions.id"),
        nullable=True,
    )  # If execution was created
    processing_error = Column(Text, nullable=True)

    # Context
    request_id = Column(String(100), nullable=True)  # For tracking

    # Relationships
    workflow = relationship("AutomationWorkflow")
    execution = relationship("WorkflowExecution", foreign_keys=[execution_id])


class AutomationTemplate(Base, TimestampMixin):
    """Pre-built automation workflow templates"""

    __tablename__ = "automation_templates"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()

    # Template information
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(
        String(50), nullable=False
    )  # "welcome", "nurture", "win_back", etc.

    # Template data
    workflow_config = Column(
        JSON, nullable=False
    )  # Complete workflow configuration
    actions_config = Column(JSON, nullable=False)  # Actions configuration

    # Metadata
    tags = Column(JSON, nullable=True)
    difficulty_level = Column(String(20), default="beginner", nullable=False)
    estimated_setup_time = Column(Integer, nullable=True)  # Minutes

    # Usage tracking
    usage_count = Column(Integer, default=0, nullable=False)
    rating = Column(Float, nullable=True)  # Average user rating

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)


class ContactJourney(Base, TimestampMixin):
    """Tracks a contact's journey through various automations"""

    __tablename__ = "contact_journeys"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()

    # Contact identification
    contact_email = Column(String(255), nullable=False, index=True)

    # Journey details
    journey_stage = Column(
        String(50), nullable=False
    )  # "awareness", "consideration", "decision", "retention"
    engagement_score = Column(Integer, default=50, nullable=False)  # 0-100

    # Workflow participation
    active_workflows = Column(
        JSON, nullable=True
    )  # List of active workflow IDs
    completed_workflows = Column(
        JSON, nullable=True
    )  # List of completed workflow IDs

    # Engagement tracking
    total_emails_received = Column(Integer, default=0, nullable=False)
    total_emails_opened = Column(Integer, default=0, nullable=False)
    total_emails_clicked = Column(Integer, default=0, nullable=False)

    # Behavioral data
    last_engagement_date = Column(DateTime, nullable=True)
    first_engagement_date = Column(DateTime, nullable=True)
    preferred_content_type = Column(String(50), nullable=True)

    # Segmentation
    segments = Column(JSON, nullable=True)  # Dynamic segments
    tags = Column(JSON, nullable=True)  # Contact tags
    custom_fields = Column(JSON, nullable=True)  # Custom field values

    # Timing preferences
    best_send_time = Column(String(5), nullable=True)  # "14:30"
    best_send_day = Column(String(10), nullable=True)  # "monday"
    timezone = Column(String(50), nullable=True)

    # Lifecycle
    lifecycle_stage = Column(
        String(50), nullable=True
    )  # "lead", "opportunity", "customer", "advocate"

    # Performance
    conversion_events = Column(
        JSON, nullable=True
    )  # List of conversion events
    revenue_attributed = Column(Float, default=0.0, nullable=False)


class AutomationMetrics(Base, TimestampMixin):
    """Aggregate metrics for automation performance"""

    __tablename__ = "automation_metrics"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()

    # Time period
    date = Column(DateTime, nullable=False, index=True)
    period_type = Column(
        String(20), nullable=False
    )  # "hour", "day", "week", "month"

    # Scope
    workflow_id = Column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("automation_workflows.id"),
        nullable=True,
    )
    action_id = Column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("workflow_actions.id"),
        nullable=True,
    )

    # Execution metrics
    executions_started = Column(Integer, default=0, nullable=False)
    executions_completed = Column(Integer, default=0, nullable=False)
    executions_failed = Column(Integer, default=0, nullable=False)

    # Email metrics
    emails_sent = Column(Integer, default=0, nullable=False)
    emails_delivered = Column(Integer, default=0, nullable=False)
    emails_opened = Column(Integer, default=0, nullable=False)
    emails_clicked = Column(Integer, default=0, nullable=False)
    emails_bounced = Column(Integer, default=0, nullable=False)

    # Engagement metrics
    unsubscribes = Column(Integer, default=0, nullable=False)
    complaints = Column(Integer, default=0, nullable=False)

    # Conversion metrics
    conversions = Column(Integer, default=0, nullable=False)
    revenue_generated = Column(Float, default=0.0, nullable=False)

    # Calculated rates
    completion_rate = Column(Float, nullable=True)
    open_rate = Column(Float, nullable=True)
    click_rate = Column(Float, nullable=True)
    conversion_rate = Column(Float, nullable=True)

    # Additional metrics
    metrics_metadata = Column(JSON, nullable=True)

    # Relationships
    workflow = relationship("AutomationWorkflow", foreign_keys=[workflow_id])
    action = relationship("WorkflowAction", foreign_keys=[action_id])


class AutomationRule(Base, TimestampMixin):
    """Rules for dynamic automation behavior"""

    __tablename__ = "automation_rules"
    __table_args__ = {"extend_existing": True}

    id = get_uuid_column()

    # Rule identification
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    # Rule scope
    workflow_id = Column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("automation_workflows.id"),
        nullable=True,
    )  # Null = global rule
    action_id = Column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("workflow_actions.id"),
        nullable=True,
    )  # Specific action rule

    # Rule definition
    rule_type = Column(
        String(50), nullable=False
    )  # "condition", "filter", "timing", "segmentation"
    conditions = Column(JSON, nullable=False)  # Rule conditions
    actions = Column(JSON, nullable=False)  # Actions to take when rule matches

    # Execution settings
    priority = Column(
        Integer, default=100, nullable=False
    )  # Lower = higher priority
    is_active = Column(Boolean, default=True, nullable=False)

    # Performance tracking
    evaluation_count = Column(Integer, default=0, nullable=False)
    match_count = Column(Integer, default=0, nullable=False)
    last_matched_at = Column(DateTime, nullable=True)

    # Metadata
    trigger_metadata = Column(JSON, nullable=True)

    # Relationships
    workflow = relationship("AutomationWorkflow", foreign_keys=[workflow_id])
    action = relationship("WorkflowAction", foreign_keys=[action_id])
