"""
Landing Page API Router
Handles public landing page endpoints including newsletter subscription 
and contact forms.
"""

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, Header, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models import Plan
from schemas.landing import (
    ContactForm,
    NewsletterSubscription,
)

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory storage for contact forms and newsletter subscriptions
_contact_forms = []
_newsletter_subscriptions = []
_support_tickets = []

# Static features data
PLATFORM_FEATURES = [
    {
        "id": 1,
        "name": "Email Campaign Management",
        "description": ("Create and manage sophisticated email campaigns "
                        "with advanced targeting"),
        "icon": "mail",
        "category": "core"
    },
    {
        "id": 2,
        "name": "SMTP & IMAP Integration",
        "description": "Connect multiple email accounts with full SMTP and IMAP support",
        "icon": "server",
        "category": "integration"
    },
    {
        "id": 3,
        "name": "AI-Powered Content Generation",
        "description": "Generate engaging email content using advanced AI models",
        "icon": "brain",
        "category": "ai"
    },
    {
        "id": 4,
        "name": "Deliverability Optimization",
        "description": "Ensure your emails reach the inbox with advanced deliverability tools",
        "icon": "shield-check",
        "category": "deliverability"
    },
    {
        "id": 5,
        "name": "Analytics & Reporting",
        "description": "Track campaign performance with detailed analytics and insights",
        "icon": "chart-bar",
        "category": "analytics"
    },
    {
        "id": 6,
        "name": "Proxy & Security",
        "description": "Advanced proxy support and security features for safe operations",
        "icon": "lock",
        "category": "security"
    }
]

# Static testimonials data
CUSTOMER_TESTIMONIALS = [
    {
        "id": 1,
        "name": "Sarah Johnson",
        "company": "TechStart Inc",
        "role": "Marketing Director",
        "content": "SGPT has revolutionized our email marketing. The AI content generation saves us hours every week.",
        "rating": 5,
        "featured": True
    },
    {
        "id": 2,
        "name": "Mike Chen",
        "company": "E-commerce Solutions",
        "role": "CEO",
        "content": "The deliverability features are outstanding. Our open rates improved by 40% after switching to SGPT.",
        "rating": 5,
        "featured": True
    },
    {
        "id": 3,
        "name": "Lisa Rodriguez",
        "company": "Digital Agency Pro",
        "role": "Campaign Manager",
        "content": "Managing multiple client campaigns has never been easier. The analytics dashboard is incredibly detailed.",
        "rating": 5,
        "featured": False
    },
    {
        "id": 4,
        "name": "David Thompson",
        "company": "SaaS Startup",
        "role": "Growth Lead",
        "content": "SGPT's automation features helped us scale our email marketing without adding team members.",
        "rating": 4,
        "featured": True
    }
]


@router.get("/")
async def landing_info(response: Response, if_none_match: str | None = Header(default=None)) -> dict[str, Any]:
    """Landing page API information."""
    # Simple strong ETag for static payload versioning
    etag = 'W/"landing-info-v1"'
    if if_none_match == etag:
        # Fast 304 if unchanged
        response.status_code = status.HTTP_304_NOT_MODIFIED
        return {}

    response.headers["ETag"] = etag
    return {
        "service": "Landing Page API",
        "version": "1.0.0",
        "description": "Public landing page endpoints",
        "endpoints": {
            "plans": "/plans",
            "contact": "/contact",
            "newsletter": "/newsletter",
            "support": "/support-ticket",
            "tickets": "/my-tickets",
            "features": "/features",
            "testimonials": "/testimonials",
        },
    }


@router.get("/plans")
async def get_plans(db: AsyncSession = Depends(get_db)):
    """Get available plans for the landing page."""
    try:
        # Get active plans from database
        query = select(Plan).where(Plan.is_active.is_(True)).order_by(
            Plan.sort_order, Plan.price_per_month
        )
        result = await db.execute(query)
        plans = result.scalars().all()
        
        # Format plans for landing page
        formatted_plans = []
        for plan in plans:
            formatted_plans.append({
                "id": plan.id,
                "name": plan.name,
                "code": plan.code,
                "price": plan.price_per_month,
                "description": plan.marketing_blurb,
                "features": plan.features or [],
                "is_trial": plan.is_trial_plan,
                "trial_duration_minutes": plan.trial_duration_minutes,
                "max_threads": plan.max_threads,
                "max_ai_calls_daily": plan.max_ai_calls_daily,
                "has_premium_support": plan.has_premium_support,
                "popular": plan.code == "premium",  # Mark premium as popular
            })
        
        return formatted_plans
    except Exception as e:
        logger.error(f"Error getting plans: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get plans",
        )


@router.post("/contact")
async def submit_contact_form(contact: ContactForm):
    """Submit contact form from landing page."""
    try:
        # Store contact form submission
        contact_data = {
            "id": len(_contact_forms) + 1,
            "name": contact.name,
            "email": contact.email,
            "subject": contact.subject,
            "message": contact.message,
            "submitted_at": datetime.now(),
            "status": "new"
        }
        
        _contact_forms.append(contact_data)
        
        logger.info(f"Contact form submitted by {contact.email}: {contact.subject}")
        
        return {
            "message": "Contact form submitted successfully",
            "id": contact_data["id"],
            "status": "received"
        }
    except Exception as e:
        logger.error(f"Error processing contact form: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit contact form",
        )


@router.post("/newsletter")
async def subscribe_newsletter(subscription: NewsletterSubscription):
    """Subscribe to newsletter from landing page."""
    try:
        # Check if email already exists
        existing = next(
            (s for s in _newsletter_subscriptions if s["email"] == subscription.email), 
            None
        )
        
        if existing:
            return {
                "message": "Email already subscribed",
                "status": "already_subscribed"
            }
        
        # Store newsletter subscription
        subscription_data = {
            "id": len(_newsletter_subscriptions) + 1,
            "email": subscription.email,
            "name": getattr(subscription, 'name', ''),
            "subscribed_at": datetime.now(),
            "status": "active",
            "source": "landing_page"
        }
        
        _newsletter_subscriptions.append(subscription_data)
        
        logger.info(f"Newsletter subscription: {subscription.email}")
        
        return {
            "message": "Newsletter subscription successful",
            "id": subscription_data["id"],
            "status": "subscribed"
        }
    except Exception as e:
        logger.error(f"Error processing newsletter subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to subscribe to newsletter",
        )


@router.post("/support-ticket")
async def create_support_ticket(ticket_data: dict):
    """Create support ticket from landing page."""
    try:
        # Create support ticket
        ticket = {
            "id": len(_support_tickets) + 1,
            "subject": ticket_data.get("subject", "Support Request"),
            "description": ticket_data.get("description", ""),
            "email": ticket_data.get("email", ""),
            "name": ticket_data.get("name", ""),
            "priority": ticket_data.get("priority", "medium"),
            "status": "open",
            "created_at": datetime.now(),
            "source": "landing_page"
        }
        
        _support_tickets.append(ticket)
        
        logger.info(f"Support ticket created: {ticket['subject']} from {ticket['email']}")
        
        return {
            "message": "Support ticket created successfully",
            "ticket_id": ticket["id"],
            "status": "created"
        }
    except Exception as e:
        logger.error(f"Error creating support ticket: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create support ticket",
        )


@router.get("/my-tickets")
async def get_my_tickets(email: str = None):
    """Get user's support tickets."""
    try:
        if not email:
            return []
        
        # Filter tickets by email
        user_tickets = [
            t for t in _support_tickets 
            if t.get("email") == email
        ]
        
        # Sort by creation date (newest first)
        user_tickets.sort(
            key=lambda x: x.get("created_at", datetime.now()), 
            reverse=True
        )
        
        return user_tickets
    except Exception as e:
        logger.error(f"Error getting tickets: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get tickets",
        )


@router.get("/features")
async def get_features(response: Response, if_none_match: str | None = Header(default=None)):
    """Get platform features for landing page."""
    try:
        etag = 'W/"landing-features-v1"'
        if if_none_match == etag:
            response.status_code = status.HTTP_304_NOT_MODIFIED
            return {}
        response.headers["ETag"] = etag
        return {
            "features": PLATFORM_FEATURES,
            "categories": [
                {"id": "core", "name": "Core Features", "description": "Essential email marketing tools"},
                {"id": "integration", "name": "Integrations", "description": "Connect with your existing tools"},
                {"id": "ai", "name": "AI-Powered", "description": "Artificial intelligence capabilities"},
                {"id": "deliverability", "name": "Deliverability", "description": "Ensure inbox placement"},
                {"id": "analytics", "name": "Analytics", "description": "Track and measure performance"},
                {"id": "security", "name": "Security", "description": "Advanced security and privacy"},
            ]
        }
    except Exception as e:
        logger.error(f"Error getting features: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get features",
        )


@router.get("/testimonials")
async def get_testimonials(featured_only: bool = False):
    """Get customer testimonials for landing page."""
    try:
        testimonials = CUSTOMER_TESTIMONIALS.copy()
        
        if featured_only:
            testimonials = [t for t in testimonials if t.get("featured", False)]
        
        return {
            "testimonials": testimonials,
            "total_count": len(CUSTOMER_TESTIMONIALS),
            "featured_count": len([t for t in CUSTOMER_TESTIMONIALS if t.get("featured", False)]),
            "average_rating": sum(t["rating"] for t in CUSTOMER_TESTIMONIALS) / len(CUSTOMER_TESTIMONIALS)
        }
    except Exception as e:
        logger.error(f"Error getting testimonials: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get testimonials",
        )


# Dynamic content endpoints
@router.get("/content", response_model=dict)
async def get_landing_content(db: AsyncSession = Depends(get_db)):
    """Get all active landing page content for the frontend."""
    try:
        # Import models here to avoid circular imports
        from models.landing import LandingSection, LandingFeature, LandingPricing
        
        # Get all active sections
        sections_result = await db.execute(
            select(LandingSection)
            .where(LandingSection.is_active == True)
            .order_by(LandingSection.order_index)
        )
        sections = sections_result.scalars().all()
        
        # Get all active features
        features_result = await db.execute(
            select(LandingFeature)
            .where(LandingFeature.is_active == True)
            .order_by(LandingFeature.order_index)
        )
        features = features_result.scalars().all()
        
        # Get all active pricing plans
        pricing_result = await db.execute(
            select(LandingPricing)
            .where(LandingPricing.is_active == True)
            .order_by(LandingPricing.order_index)
        )
        pricing_plans = pricing_result.scalars().all()
        
        # Format response
        sections_dict = {section.section_type: section.content for section in sections}
        
        # Add default sections if not present
        default_sections = {
            "hero": {
                "headline": "Transform Your Email Marketing with AI",
                "subheadline": "Next-generation platform powered by GPT-4",
                "ctaText": "Start Free Trial",
                "ctaLink": "/auth/register"
            }
        }
        
        for section_type, default_content in default_sections.items():
            if section_type not in sections_dict:
                sections_dict[section_type] = default_content
        
        return {
            "sections": sections_dict,
            "features": [
                {
                    "id": str(feature.id),
                    "title": feature.title,
                    "description": feature.description,
                    "icon": feature.icon,
                    "tech_stack": feature.tech_stack,
                    "gradient": feature.gradient,
                    "animation": feature.animation,
                    "is_active": feature.is_active,
                    "order_index": feature.order_index
                }
                for feature in features
            ],
            "pricing": [
                {
                    "id": str(plan.id),
                    "name": plan.name,
                    "price": plan.price,
                    "period": plan.period,
                    "description": plan.description,
                    "features": plan.features or [],
                    "icon": plan.icon,
                    "is_popular": plan.is_popular,
                    "badge_text": plan.badge_text,
                    "cta_text": plan.cta_text,
                    "is_active": plan.is_active,
                    "order_index": plan.order_index
                }
                for plan in pricing_plans
            ]
        }
    except Exception as e:
        logger.error(f"Error getting landing content: {e}")
        # Return static content as fallback
        return {
            "sections": {
                "hero": {
                    "headline": "Transform Your Email Marketing with AI",
                    "subheadline": "Next-generation platform powered by GPT-4",
                    "ctaText": "Start Free Trial",
                    "ctaLink": "/auth/register"
                }
            },
            "features": [],
            "pricing": []
        }
