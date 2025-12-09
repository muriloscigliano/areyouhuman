"""Webhook data models."""

from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel


class WebhookEvent(str, Enum):
    """Supported webhook event types."""

    LEAD_CREATED = "lead.created"
    LEAD_UPDATED = "lead.updated"
    QUOTE_ACCEPTED = "quote.accepted"
    QUOTE_DECLINED = "quote.declined"
    CONVERSATION_COMPLETED = "conversation.completed"


class WebhookPayload(BaseModel):
    """Incoming webhook payload structure."""

    event: WebhookEvent
    data: Dict[str, Any]
    timestamp: Optional[str] = None


class WebhookResponse(BaseModel):
    """Webhook response structure."""

    success: bool
    message: Optional[str] = None
    event: Optional[str] = None
    error: Optional[str] = None
