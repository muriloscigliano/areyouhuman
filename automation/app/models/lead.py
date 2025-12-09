"""Lead data models."""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class LeadStatus(str, Enum):
    """Lead lifecycle status."""

    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    NURTURE = "nurture"
    QUOTED = "quoted"
    CONVERTED = "converted"
    LOST = "lost"
    SPAM = "spam"


class LeadQuality(str, Enum):
    """Lead quality classification."""

    HIGH = "high"  # Score >= 70
    MEDIUM = "medium"  # Score 40-69
    LOW = "low"  # Score < 40


class LeadScore(BaseModel):
    """Detailed lead scoring breakdown."""

    total: int = Field(ge=0, le=100)
    interest_level: int = Field(ge=0, le=20)
    budget_clarity: int = Field(ge=0, le=20)
    urgency: int = Field(ge=0, le=15)
    problem_clarity: int = Field(ge=0, le=20)
    decision_authority: int = Field(ge=0, le=15)
    tech_readiness: int = Field(ge=0, le=10)

    @property
    def quality(self) -> LeadQuality:
        if self.total >= 70:
            return LeadQuality.HIGH
        elif self.total >= 40:
            return LeadQuality.MEDIUM
        return LeadQuality.LOW


class LeadBase(BaseModel):
    """Base lead fields."""

    name: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    problem_text: Optional[str] = None
    automation_area: Optional[str] = None
    tools_used: Optional[List[str]] = None
    budget_range: Optional[str] = None
    timeline: Optional[str] = None
    urgency: Optional[str] = None


class LeadCreate(LeadBase):
    """Lead creation payload."""

    source: str = "chat"
    interest_level: Optional[int] = Field(default=None, ge=1, le=10)


class LeadUpdate(LeadBase):
    """Lead update payload."""

    status: Optional[LeadStatus] = None
    lead_score: Optional[int] = Field(default=None, ge=0, le=100)
    interest_level: Optional[int] = Field(default=None, ge=1, le=10)


class Lead(LeadBase):
    """Complete lead model with all fields."""

    id: str
    status: LeadStatus = LeadStatus.NEW
    lead_score: Optional[int] = None
    interest_level: Optional[int] = None
    source: str = "chat"
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_contact_at: Optional[datetime] = None
    converted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @property
    def is_qualified(self) -> bool:
        """Check if lead is qualified for quote generation."""
        return (
            self.name is not None
            and self.email is not None
            and self.company is not None
            and self.problem_text is not None
            and len(self.problem_text) >= 20
        )

    @property
    def is_complete(self) -> bool:
        """Check if lead has all important fields."""
        return (
            self.is_qualified
            and self.budget_range is not None
            and self.timeline is not None
        )
