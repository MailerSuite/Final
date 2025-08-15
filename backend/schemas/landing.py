"""
Landing Page Schemas
Pydantic models for landing page API endpoints
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr


class NewsletterSubscription(BaseModel):
    """Newsletter subscription model"""

    email: EmailStr
    name: str | None = None
    source: str | None = "landing_page"
    marketing_consent: bool = True
    subscribed_at: datetime | None = None


class ContactForm(BaseModel):
    """Contact form model"""

    name: str
    email: EmailStr
    subject: str
    message: str
    company: str | None = None
    phone: str | None = None
    submitted_at: datetime | None = None


class LandingResponse(BaseModel):
    """Standard landing page response"""

    success: bool
    message: str
    timestamp: datetime
    data: dict | None = None


class LandingStats(BaseModel):
    """Landing page statistics"""

    total_subscribers: int
    total_contacts: int
    conversion_rate: float
    last_updated: datetime


class Feature(BaseModel):
    """Platform feature for landing page"""

    title: str
    description: str
    icon: str
    category: str | None = None


class Testimonial(BaseModel):
    """Customer testimonial"""

    name: str
    company: str
    text: str
    rating: int
    avatar_url: str | None = None


class LandingFeatures(BaseModel):
    """Landing page features response"""

    features: list[Feature]


class LandingTestimonials(BaseModel):
    """Landing page testimonials response"""

    testimonials: list[Testimonial]


# Admin schemas for content management
class LandingSectionCreate(BaseModel):
    """Create/update landing section"""
    section_type: str
    content: dict
    is_active: bool = True
    order_index: int = 0


class LandingSectionResponse(BaseModel):
    """Landing section response"""
    id: str
    section_type: str
    content: dict
    is_active: bool
    order_index: int
    updated_at: datetime | None = None


class LandingFeatureCreate(BaseModel):
    """Create/update landing feature"""
    title: str
    description: str
    icon: str
    tech_stack: str | None = None
    gradient: str | None = None
    animation: str | None = None
    is_active: bool = True
    order_index: int = 0


class LandingFeatureResponse(BaseModel):
    """Landing feature response"""
    id: str
    title: str
    description: str
    icon: str
    tech_stack: str | None = None
    gradient: str | None = None
    animation: str | None = None
    is_active: bool
    order_index: int


class LandingPricingCreate(BaseModel):
    """Create/update pricing plan"""
    name: str
    price: str
    period: str
    description: str
    features: list[str]
    icon: str | None = None
    is_popular: bool = False
    badge_text: str | None = None
    cta_text: str = "Get Started"
    is_active: bool = True
    order_index: int = 0


class LandingPricingResponse(BaseModel):
    """Pricing plan response"""
    id: str
    name: str
    price: str
    period: str
    description: str
    features: list[str]
    icon: str | None = None
    is_popular: bool
    badge_text: str | None = None
    cta_text: str
    is_active: bool
    order_index: int


class LandingContentResponse(BaseModel):
    """Complete landing page content"""
    sections: dict[str, dict]
    features: list[LandingFeatureResponse]
    pricing: list[LandingPricingResponse]


class LandingLeadResponse(BaseModel):
    """Landing lead response"""
    id: str
    email: str
    name: str | None = None
    company: str | None = None
    phone: str | None = None
    source: str
    created_at: datetime
    converted_to_user: bool
