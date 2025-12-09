"""Quote data models."""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class QuoteStatus(str, Enum):
    """Quote lifecycle status."""

    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"


class QuoteItem(BaseModel):
    """Individual line item in a quote."""

    title: str
    description: str
    amount: float = Field(ge=0)
    hours: Optional[int] = Field(default=None, ge=0)
    unit: str = "fixed"  # fixed, hourly, monthly


class QuoteCreate(BaseModel):
    """Quote creation payload."""

    lead_id: str
    project_title: str
    project_summary: str
    scope_items: List[QuoteItem]
    currency: str = "AUD"
    valid_days: int = Field(default=30, ge=1, le=90)
    notes: Optional[str] = None
    discount_percent: Optional[float] = Field(default=None, ge=0, le=100)


class Quote(BaseModel):
    """Complete quote model."""

    id: str
    lead_id: str
    project_title: str
    project_summary: str
    scope_items: List[QuoteItem]
    subtotal: float
    discount_amount: float = 0
    tax_amount: float = 0
    total_amount: float
    currency: str = "AUD"
    status: QuoteStatus = QuoteStatus.DRAFT
    valid_until: datetime
    notes: Optional[str] = None
    created_at: datetime
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    declined_at: Optional[datetime] = None
    decline_reason: Optional[str] = None

    class Config:
        from_attributes = True

    @property
    def is_expired(self) -> bool:
        """Check if quote has expired."""
        return datetime.utcnow() > self.valid_until

    @property
    def is_active(self) -> bool:
        """Check if quote is still active (not accepted/declined/expired)."""
        return self.status in [QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.VIEWED]
