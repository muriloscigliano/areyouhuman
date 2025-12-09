"""Data models for the automation service."""

from .lead import Lead, LeadCreate, LeadUpdate, LeadScore, LeadQuality
from .quote import Quote, QuoteCreate, QuoteItem
from .webhook import WebhookPayload, WebhookEvent

__all__ = [
    "Lead",
    "LeadCreate",
    "LeadUpdate",
    "LeadScore",
    "LeadQuality",
    "Quote",
    "QuoteCreate",
    "QuoteItem",
    "WebhookPayload",
    "WebhookEvent",
]
