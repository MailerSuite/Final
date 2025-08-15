"""
Landing Page Models
Database models for dynamic landing page content management
"""

from sqlalchemy import Column, String, Text, Integer, Boolean, JSON, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from core.database import Base


class LandingSection(Base):
    """Dynamic landing page sections (hero, cta, etc)"""
    __tablename__ = "landing_sections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    section_type = Column(String(50), nullable=False, unique=True)  # hero, features, pricing, etc
    content = Column(JSON, nullable=False, default={})  # Dynamic content
    is_active = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "section_type": self.section_type,
            "content": self.content,
            "is_active": self.is_active,
            "order_index": self.order_index,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class LandingFeature(Base):
    """Individual features for the features section"""
    __tablename__ = "landing_features"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    icon = Column(String(50))  # lucide icon name
    tech_stack = Column(String(255))
    gradient = Column(String(100))  # CSS gradient class
    animation = Column(String(50))  # Animation class
    is_active = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "title": self.title,
            "description": self.description,
            "icon": self.icon,
            "tech_stack": self.tech_stack,
            "gradient": self.gradient,
            "animation": self.animation,
            "is_active": self.is_active,
            "order_index": self.order_index
        }


class LandingPricing(Base):
    """Pricing plans for the landing page"""
    __tablename__ = "landing_pricing"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    price = Column(String(50), nullable=False)  # "$99" format for display
    period = Column(String(50))  # "per month", "per year", etc
    description = Column(Text)
    features = Column(JSON, default=[])  # Array of feature strings
    icon = Column(String(50))  # lucide icon name
    is_popular = Column(Boolean, default=False)
    badge_text = Column(String(50))  # "Most Popular", "Best Value", etc
    cta_text = Column(String(100), default="Get Started")
    is_active = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "price": self.price,
            "period": self.period,
            "description": self.description,
            "features": self.features,
            "icon": self.icon,
            "is_popular": self.is_popular,
            "badge_text": self.badge_text,
            "cta_text": self.cta_text,
            "is_active": self.is_active,
            "order_index": self.order_index
        }


class LandingLead(Base):
    """Leads captured from landing page forms"""
    __tablename__ = "landing_leads"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False)
    name = Column(String(255))
    company = Column(String(255))
    phone = Column(String(50))
    message = Column(Text)
    source = Column(String(50))  # contact_form, newsletter, demo_request
    utm_source = Column(String(100))
    utm_medium = Column(String(100))
    utm_campaign = Column(String(100))
    ip_address = Column(String(45))  # Support IPv6
    user_agent = Column(Text)
    referrer = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Conversion tracking
    converted_to_user = Column(Boolean, default=False)
    converted_at = Column(TIMESTAMP, nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "email": self.email,
            "name": self.name,
            "company": self.company,
            "phone": self.phone,
            "source": self.source,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "converted_to_user": self.converted_to_user
        }


class LandingAnalytics(Base):
    """Analytics events for landing page tracking"""
    __tablename__ = "landing_analytics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(String(255), nullable=False)
    event_type = Column(String(50), nullable=False)  # page_view, cta_click, form_submit, etc
    event_data = Column(JSON, default={})
    page_path = Column(String(255))
    referrer = Column(Text)
    user_agent = Column(Text)
    ip_address = Column(String(45))
    country_code = Column(String(2))
    device_type = Column(String(50))  # desktop, mobile, tablet
    browser = Column(String(50))
    os = Column(String(50))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "session_id": self.session_id,
            "event_type": self.event_type,
            "event_data": self.event_data,
            "device_type": self.device_type,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }