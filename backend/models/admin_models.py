"""
Admin Database Models - Separate models for admin panel operations
Designed for independent deployment and cross-database synchronization
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

# Separate base for admin models
AdminBase = declarative_base()

class AdminTimestampMixin:
    """Timestamp mixin for admin models"""
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

class AdminUser(AdminBase, AdminTimestampMixin):
    """Admin-specific user model with proper plan relationship"""
    __tablename__ = "admin_users"
    
    id = Column(Integer, primary_key=True, index=True)
    # Core user data synchronized from main database
    main_user_id = Column(String(36), unique=True, nullable=False)  # UUID from main DB
    email = Column(String(255), unique=True, nullable=False)
    username = Column(String(100), unique=True, nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    
    # Admin-specific fields
    last_login_at = Column(DateTime, nullable=True)
    login_count = Column(Integer, default=0)
    last_ip_address = Column(String(45), nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    account_locked_until = Column(DateTime, nullable=True)
    
    # Plan relationship (fixed the missing attribute issue)
    plan_id = Column(Integer, ForeignKey("admin_plans.id"), nullable=True)
    plan = relationship("AdminPlan", back_populates="users")
    
    # User statistics
    total_campaigns = Column(Integer, default=0)
    total_emails_sent = Column(Integer, default=0)
    account_value_usd = Column(Float, default=0.0)
    last_activity_at = Column(DateTime, nullable=True)
    
    # Relationships
    user_plan = relationship("AdminUserPlan", back_populates="user", uselist=False)
    support_tickets = relationship("AdminSupportTicket", back_populates="user", foreign_keys="[AdminSupportTicket.user_id]")
    activity_logs = relationship("AdminUserActivity", back_populates="user")

class AdminPlan(AdminBase, AdminTimestampMixin):
    """Admin-specific plan model"""
    __tablename__ = "admin_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    # Core plan data synchronized from main database
    main_plan_id = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False)
    price_per_month = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Admin-specific plan analytics
    total_users = Column(Integer, default=0)
    active_users = Column(Integer, default=0)
    revenue_monthly = Column(Float, default=0.0)
    
    # Features and limits
    max_campaigns = Column(Integer, nullable=True)
    max_emails_daily = Column(Integer, nullable=True)
    features = Column(JSON, default=list)
    
    # Relationships
    users = relationship("AdminUser", back_populates="plan")
    user_plans = relationship("AdminUserPlan", back_populates="plan")

class AdminUserPlan(AdminBase, AdminTimestampMixin):
    """Admin user plan assignment"""
    __tablename__ = "admin_user_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("admin_users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("admin_plans.id"), nullable=False)
    
    # Plan assignment details
    is_active = Column(Boolean, default=True)
    starts_at = Column(DateTime, default=func.now())
    expires_at = Column(DateTime, nullable=True)
    is_trial = Column(Boolean, default=False)
    auto_renew = Column(Boolean, default=True)
    
    # Payment information
    last_payment_at = Column(DateTime, nullable=True)
    payment_method = Column(String(50), nullable=True)
    payment_status = Column(String(50), default="active")
    
    # Relationships
    user = relationship("AdminUser", back_populates="user_plan")
    plan = relationship("AdminPlan", back_populates="user_plans")

class AdminSupportTicket(AdminBase, AdminTimestampMixin):
    """Admin support ticket management"""
    __tablename__ = "admin_support_tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("admin_users.id"), nullable=False)
    
    # Ticket details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="open")  # open, in_progress, resolved, closed
    priority = Column(String(20), default="medium")  # low, medium, high, urgent
    category = Column(String(100), nullable=True)
    
    # Admin assignment
    assigned_admin_id = Column(Integer, ForeignKey("admin_users.id"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("AdminUser", back_populates="support_tickets", foreign_keys=[user_id])
    assigned_admin = relationship("AdminUser", foreign_keys=[assigned_admin_id])
    replies = relationship("AdminTicketReply", back_populates="ticket")

class AdminTicketReply(AdminBase, AdminTimestampMixin):
    """Ticket replies"""
    __tablename__ = "admin_ticket_replies"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("admin_support_tickets.id"), nullable=False)
    admin_user_id = Column(Integer, ForeignKey("admin_users.id"), nullable=False)
    
    message = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)  # Internal admin notes
    
    # Relationships
    ticket = relationship("AdminSupportTicket", back_populates="replies")
    admin_user = relationship("AdminUser")

class AdminUserActivity(AdminBase, AdminTimestampMixin):
    """Track user activity for admin monitoring"""
    __tablename__ = "admin_user_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("admin_users.id"), nullable=False)
    
    # Activity details
    activity_type = Column(String(100), nullable=False)  # login, campaign_created, etc.
    description = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Additional data
    extra_data = Column(JSON, default=dict)
    
    # Relationships
    user = relationship("AdminUser", back_populates="activity_logs")

class AdminSystemStats(AdminBase, AdminTimestampMixin):
    """System-wide statistics for admin dashboard"""
    __tablename__ = "admin_system_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Core metrics
    total_users = Column(Integer, default=0)
    active_users_today = Column(Integer, default=0)
    active_users_week = Column(Integer, default=0)
    active_users_month = Column(Integer, default=0)
    
    # Campaign metrics
    total_campaigns = Column(Integer, default=0)
    campaigns_today = Column(Integer, default=0)
    total_emails_sent = Column(Integer, default=0)
    emails_sent_today = Column(Integer, default=0)
    
    # Revenue metrics
    total_revenue = Column(Float, default=0.0)
    revenue_today = Column(Float, default=0.0)
    revenue_month = Column(Float, default=0.0)
    
    # System metrics
    system_load_avg = Column(Float, default=0.0)
    memory_usage_percent = Column(Float, default=0.0)
    disk_usage_percent = Column(Float, default=0.0)
    
    # Snapshot timestamp
    snapshot_at = Column(DateTime, default=func.now())

class AdminSecurityEvent(AdminBase, AdminTimestampMixin):
    """Security events for admin monitoring"""
    __tablename__ = "admin_security_events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("admin_users.id"), nullable=True)
    
    # Event details
    event_type = Column(String(100), nullable=False)  # failed_login, suspicious_activity, etc.
    severity = Column(String(20), default="medium")  # low, medium, high, critical
    description = Column(Text, nullable=False)
    
    # Source information
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    country = Column(String(100), nullable=True)
    
    # Response
    action_taken = Column(String(255), nullable=True)
    resolved = Column(Boolean, default=False)
    
    # Additional data
    extra_data = Column(JSON, default=dict)
    
    # Relationships
    user = relationship("AdminUser")

# Export all admin models
__all__ = [
    "AdminBase",
    "AdminUser", 
    "AdminPlan",
    "AdminUserPlan",
    "AdminSupportTicket",
    "AdminTicketReply", 
    "AdminUserActivity",
    "AdminSystemStats",
    "AdminSecurityEvent",
]