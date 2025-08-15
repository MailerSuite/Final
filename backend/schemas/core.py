"""
Core Schemas
Payment processing and core application schemas
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, validator


class PaymentRequestCreate(BaseModel):
    """Schema for creating a payment request"""
    amount: Decimal
    currency: str = "BTC"
    description: Optional[str] = None
    metadata: Optional[dict] = None
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v


class PaymentRequestResponse(BaseModel):
    """Schema for payment request response"""
    id: UUID
    amount: Decimal
    currency: str
    status: str
    address: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PaymentStatusResponse(BaseModel):
    """Schema for payment status response"""
    id: UUID
    status: str
    amount_received: Optional[Decimal] = None
    confirmations: int = 0
    transaction_id: Optional[str] = None
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AdminPaymentResponse(BaseModel):
    """Schema for admin payment overview"""
    id: UUID
    user_id: UUID
    amount: Decimal
    status: str
    created_at: datetime
    updated_at: datetime
    metadata: Optional[dict] = None
    
    class Config:
        from_attributes = True


class WalletInfoResponse(BaseModel):
    """Schema for wallet information"""
    balance: Decimal
    address: str
    network: str = "bitcoin"
    status: str = "active"


class SystemInfoResponse(BaseModel):
    """Schema for system information"""
    version: str
    status: str
    uptime: str
    active_sessions: int
    total_users: int
    last_updated: datetime 