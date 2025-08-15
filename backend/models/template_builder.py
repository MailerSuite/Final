"""
Template Builder Models
Visual drag-and-drop template builder system
"""

import uuid

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
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class TemplateLayout(Base):
    """Template layout definitions and configurations"""

    __tablename__ = "template_layouts"

    id = Column(
        UUID(), primary_key=True, default=uuid.uuid4
    )
    session_id = Column(
        UUID(),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Layout details
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(
        String(50), nullable=False, default="custom"
    )  # "newsletter", "promotional", "transactional", "custom"

    # Layout structure
    layout_type = Column(
        String(30), nullable=False, default="single_column"
    )  # "single_column", "two_column", "three_column", "header_footer"
    grid_system = Column(
        String(20), nullable=False, default="12_column"
    )  # "12_column", "flexbox", "css_grid"

    # Layout configuration
    layout_config = Column(
        JSON, nullable=False, default={}
    )  # Contains grid definitions, spacing, etc.
    container_settings = Column(
        JSON, nullable=False, default={}
    )  # Max width, padding, margins

    # Responsive settings
    mobile_config = Column(JSON, nullable=True)  # Mobile-specific overrides
    tablet_config = Column(JSON, nullable=True)  # Tablet-specific overrides

    # Styling
    background_color = Column(String(20), nullable=True, default="#ffffff")
    background_image = Column(Text, nullable=True)
    custom_css = Column(Text, nullable=True)

    # Template metadata
    is_template = Column(
        Boolean, default=False
    )  # If true, can be used as a base template
    is_public = Column(
        Boolean, default=False
    )  # If true, available to all users
    usage_count = Column(Integer, default=0)

    # Status
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )

    # Relationships
    blocks = relationship(
        "TemplateBlock", back_populates="layout", cascade="all, delete-orphan"
    )
    templates = relationship(
        "EmailTemplate",
        foreign_keys="EmailTemplate.layout_id",
        overlaps="layout",
    )


class TemplateBlock(Base):
    """Individual blocks/components within a template layout"""

    __tablename__ = "template_blocks"

    id = Column(
        UUID(), primary_key=True, default=uuid.uuid4
    )
    layout_id = Column(
        UUID(),
        ForeignKey("template_layouts.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Block identification
    block_type = Column(
        String(50), nullable=False
    )  # "text", "image", "button", "divider", "social", "product", "code"
    block_name = Column(String(255), nullable=True)  # User-defined name

    # Position and layout
    row_position = Column(Integer, nullable=False, default=0)
    column_position = Column(Integer, nullable=False, default=0)
    column_span = Column(
        Integer, nullable=False, default=12
    )  # How many columns this block spans
    row_span = Column(
        Integer, nullable=False, default=1
    )  # How many rows this block spans

    # Display order within the same position
    sort_order = Column(Integer, nullable=False, default=0)

    # Block content
    content = Column(
        JSON, nullable=False, default={}
    )  # Block-specific content data
    styling = Column(JSON, nullable=False, default={})  # CSS styling options

    # Responsive behavior
    mobile_settings = Column(JSON, nullable=True)  # Mobile-specific overrides
    tablet_settings = Column(JSON, nullable=True)  # Tablet-specific overrides

    # Interaction settings
    is_editable = Column(Boolean, default=True)
    is_removable = Column(Boolean, default=True)
    is_movable = Column(Boolean, default=True)

    # Conditional display
    display_conditions = Column(
        JSON, nullable=True
    )  # Conditions for showing this block

    # Status
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )

    # Relationships
    layout = relationship("TemplateLayout", back_populates="blocks")


class TemplateBlockType(Base):
    """Definitions for available block types and their configurations"""

    __tablename__ = "template_block_types"

    id = Column(
        UUID(), primary_key=True, default=uuid.uuid4
    )

    # Block type definition
    type_name = Column(
        String(50), nullable=False, unique=True
    )  # "text", "image", "button", etc.
    display_name = Column(
        String(100), nullable=False
    )  # "Text Block", "Image Block", etc.
    description = Column(Text, nullable=True)
    category = Column(
        String(50), nullable=False, default="content"
    )  # "content", "layout", "social", "ecommerce"

    # Configuration
    default_config = Column(
        JSON, nullable=False, default={}
    )  # Default configuration for this block type
    config_schema = Column(
        JSON, nullable=False, default={}
    )  # JSON schema for validation

    # Styling options
    available_styles = Column(
        JSON, nullable=False, default={}
    )  # Available styling options
    default_styles = Column(
        JSON, nullable=False, default={}
    )  # Default styling

    # Icon and preview
    icon = Column(String(50), nullable=True)  # Icon identifier for UI
    preview_image = Column(Text, nullable=True)  # URL to preview image
    thumbnail = Column(Text, nullable=True)  # URL to thumbnail

    # Behavior
    supports_responsive = Column(Boolean, default=True)
    supports_conditions = Column(Boolean, default=True)
    min_height = Column(Integer, nullable=True)  # Minimum height in pixels
    max_height = Column(Integer, nullable=True)  # Maximum height in pixels

    # Availability
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)  # Requires premium plan
    plan_requirements = Column(
        JSON, nullable=True
    )  # Plan codes that can use this block

    # Usage tracking
    usage_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )


class TemplateTheme(Base):
    """Pre-defined themes with color schemes and styling"""

    __tablename__ = "template_themes"

    id = Column(
        UUID(), primary_key=True, default=uuid.uuid4
    )

    # Theme details
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(
        String(50), nullable=False, default="business"
    )  # "business", "creative", "minimal", "bold"

    # Color scheme
    primary_color = Column(String(20), nullable=False)
    secondary_color = Column(String(20), nullable=False)
    accent_color = Column(String(20), nullable=False)
    background_color = Column(String(20), nullable=False, default="#ffffff")
    text_color = Column(String(20), nullable=False, default="#333333")

    # Typography
    heading_font = Column(
        String(100), nullable=False, default="Arial, sans-serif"
    )
    body_font = Column(
        String(100), nullable=False, default="Arial, sans-serif"
    )
    font_sizes = Column(
        JSON, nullable=False, default={}
    )  # h1, h2, h3, body, small

    # Styling presets
    button_styles = Column(JSON, nullable=False, default={})
    link_styles = Column(JSON, nullable=False, default={})
    border_styles = Column(JSON, nullable=False, default={})
    spacing_config = Column(JSON, nullable=False, default={})

    # Theme assets
    preview_image = Column(Text, nullable=True)
    thumbnail = Column(Text, nullable=True)
    custom_css = Column(Text, nullable=True)

    # Availability
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)

    # Usage tracking
    usage_count = Column(Integer, default=0)
    rating = Column(Float, nullable=True)  # Average user rating

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )


class TemplateBuilderSession(Base):
    """Tracks template builder sessions for auto-save and collaboration"""

    __tablename__ = "template_builder_sessions"

    id = Column(
        UUID(), primary_key=True, default=uuid.uuid4
    )

    # Session details
    user_session_id = Column(
        UUID(),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    template_id = Column(
        UUID(),
        ForeignKey("email_templates.id", ondelete="CASCADE"),
        nullable=True,
    )
    layout_id = Column(
        UUID(),
        ForeignKey("template_layouts.id", ondelete="CASCADE"),
        nullable=True,
    )

    # Session state
    session_name = Column(String(255), nullable=True)
    current_state = Column(
        JSON, nullable=False, default={}
    )  # Current editor state
    auto_save_data = Column(JSON, nullable=True)  # Auto-saved changes

    # Activity tracking
    last_activity = Column(DateTime(timezone=True), default=func.now())
    changes_count = Column(Integer, default=0)

    # Session status
    is_active = Column(Boolean, default=True)
    session_expired = Column(Boolean, default=False)

    # Collaboration (for future use)
    is_collaborative = Column(Boolean, default=False)
    collaborators = Column(JSON, nullable=True)  # List of user IDs

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now()
    )

    # Relationships
    template = relationship("EmailTemplate", foreign_keys=[template_id])
    layout = relationship("TemplateLayout", foreign_keys=[layout_id])
