"""
Webhook API endpoints
Handles incoming webhooks from Supabase and other services
"""

from datetime import datetime, timedelta
from typing import Optional

import structlog
from fastapi import APIRouter, Header, HTTPException, Request

from ..config import settings
from ..models.lead import Lead, LeadStatus
from ..models.quote import Quote, QuoteStatus
from ..models.webhook import WebhookPayload, WebhookEvent, WebhookResponse
from ..services.lead_processor import LeadProcessor
from ..services.email_service import EmailService
from ..services.quote_generator import QuoteGenerator
from ..services.notification_service import NotificationService
from ..utils.security import verify_signature
from ..utils.db import get_db, get_quote_with_lead, update_quote_status, update_lead_status, update_conversation_status

logger = structlog.get_logger()
router = APIRouter(prefix="/webhooks", tags=["webhooks"])

# Service instances
lead_processor = LeadProcessor()
email_service = EmailService()
quote_generator = QuoteGenerator()
notification_service = NotificationService()


@router.post("/lead", response_model=WebhookResponse)
async def handle_lead_webhook(
    request: Request,
    x_webhook_signature: Optional[str] = Header(None),
):
    """
    Handle lead-related webhooks from Supabase.

    Events:
    - lead.created: New lead created, trigger scoring and routing
    - lead.updated: Lead data updated
    """
    # Get raw body for signature verification
    raw_body = await request.body()
    body_str = raw_body.decode("utf-8")

    # Verify signature if secret is configured
    if settings.webhook_secret:
        if not verify_signature(body_str, x_webhook_signature, settings.webhook_secret):
            logger.warning("Invalid webhook signature")
            raise HTTPException(status_code=401, detail="Invalid signature")

    # Parse payload
    try:
        payload = WebhookPayload.model_validate_json(raw_body)
    except Exception as e:
        logger.error("Invalid webhook payload", error=str(e))
        raise HTTPException(status_code=400, detail="Invalid payload")

    logger.info("Lead webhook received", event=payload.event)

    try:
        if payload.event == WebhookEvent.LEAD_CREATED:
            await _handle_lead_created(payload.data)
        elif payload.event == WebhookEvent.LEAD_UPDATED:
            await _handle_lead_updated(payload.data)
        else:
            logger.warning("Unknown event type", event=payload.event)

        return WebhookResponse(success=True, event=payload.event)

    except Exception as e:
        logger.error("Webhook processing failed", error=str(e))
        return WebhookResponse(success=False, error=str(e))


@router.post("/quote", response_model=WebhookResponse)
async def handle_quote_webhook(
    request: Request,
    x_webhook_signature: Optional[str] = Header(None),
):
    """
    Handle quote-related webhooks.

    Events:
    - quote.accepted: Quote was accepted by client
    - quote.declined: Quote was declined by client
    """
    raw_body = await request.body()
    body_str = raw_body.decode("utf-8")

    if settings.webhook_secret:
        if not verify_signature(body_str, x_webhook_signature, settings.webhook_secret):
            raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        payload = WebhookPayload.model_validate_json(raw_body)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid payload")

    logger.info("Quote webhook received", event=payload.event)

    try:
        if payload.event == WebhookEvent.QUOTE_ACCEPTED:
            await _handle_quote_accepted(payload.data)
        elif payload.event == WebhookEvent.QUOTE_DECLINED:
            await _handle_quote_declined(payload.data)

        return WebhookResponse(success=True, event=payload.event)

    except Exception as e:
        logger.error("Quote webhook failed", error=str(e))
        return WebhookResponse(success=False, error=str(e))


@router.post("/conversation", response_model=WebhookResponse)
async def handle_conversation_webhook(
    request: Request,
    x_webhook_signature: Optional[str] = Header(None),
):
    """
    Handle conversation-related webhooks.

    Events:
    - conversation.completed: Chat conversation completed
    """
    raw_body = await request.body()
    body_str = raw_body.decode("utf-8")

    if settings.webhook_secret:
        if not verify_signature(body_str, x_webhook_signature, settings.webhook_secret):
            raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        payload = WebhookPayload.model_validate_json(raw_body)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid payload")

    logger.info("Conversation webhook received", event=payload.event)

    try:
        if payload.event == WebhookEvent.CONVERSATION_COMPLETED:
            await _handle_conversation_completed(payload.data)

        return WebhookResponse(success=True, event=payload.event)

    except Exception as e:
        logger.error("Conversation webhook failed", error=str(e))
        return WebhookResponse(success=False, error=str(e))


# =============================================================================
# EVENT HANDLERS
# =============================================================================


async def _handle_lead_created(data: dict):
    """Process new lead - score, route, and notify."""
    logger.info("Processing new lead", lead_id=data.get("id"))

    # Create Lead model from data
    lead = Lead(
        id=data.get("id", ""),
        name=data.get("name"),
        email=data.get("email"),
        company=data.get("company"),
        role=data.get("role"),
        industry=data.get("industry"),
        company_size=data.get("company_size"),
        problem_text=data.get("problem_text"),
        automation_area=data.get("automation_area"),
        tools_used=data.get("tools_used"),
        budget_range=data.get("budget_range"),
        timeline=data.get("timeline"),
        urgency=data.get("urgency"),
        interest_level=data.get("interest_level"),
        source=data.get("source", "chat"),
        status=LeadStatus.NEW,
        created_at=datetime.utcnow(),
    )

    # Score the lead
    score = await lead_processor.score_lead(lead)
    logger.info("Lead scored", lead_id=lead.id, score=score.total, quality=score.quality.value)

    # Route based on score
    workflow = await lead_processor.route_lead(lead, score)

    # Send welcome email
    if lead.email and lead.name:
        await email_service.send_welcome(
            to=lead.email,
            name=lead.name,
            company=lead.company,
            automation_area=lead.automation_area,
            problem_text=lead.problem_text,
        )

    # Notify team for qualified leads
    if score.quality.value == "high":
        await notification_service.notify_new_lead(
            lead_name=lead.name or "Unknown",
            lead_email=lead.email or "",
            company=lead.company,
            lead_score=score.total,
            automation_area=lead.automation_area,
        )

        # Send team email
        await email_service.send_team_notification(
            lead_name=lead.name or "Unknown",
            lead_email=lead.email or "",
            company=lead.company,
            project_summary=lead.problem_text,
            lead_score=score.total,
        )

        # Generate quote for high-quality leads
        if lead.is_qualified:
            quote_data = await quote_generator.generate_quote(lead)
            logger.info("Quote generated for qualified lead", lead_id=lead.id)

    logger.info("Lead processing complete", lead_id=lead.id, workflow=workflow)


async def _handle_lead_updated(data: dict):
    """Handle lead update - re-score if needed."""
    logger.info("Lead updated", lead_id=data.get("id"))
    # Could re-score lead if significant fields changed


async def _handle_quote_accepted(data: dict):
    """Process quote acceptance."""
    quote_id = data.get("quote_id")
    logger.info("Quote accepted", quote_id=quote_id)

    # Get quote and lead details
    quote_data = await get_quote_with_lead(quote_id)
    if not quote_data:
        logger.error("Quote not found", quote_id=quote_id)
        return

    # Update quote status
    await update_quote_status(quote_id, "accepted")

    # Update lead status
    lead_id = quote_data.get("lead_id")
    if lead_id:
        await update_lead_status(lead_id, "converted")

    # Send notification
    await notification_service.notify_quote_accepted(
        lead_name=quote_data.get("lead_name", "Unknown"),
        company=quote_data.get("lead_company"),
        project_title=quote_data.get("project_title", "Project"),
        amount=quote_data.get("total_amount", 0),
    )


async def _handle_quote_declined(data: dict):
    """Process quote decline."""
    quote_id = data.get("quote_id")
    reason = data.get("reason")
    logger.info("Quote declined", quote_id=quote_id, reason=reason)

    # Get quote and lead details
    quote_data = await get_quote_with_lead(quote_id)
    if not quote_data:
        logger.error("Quote not found", quote_id=quote_id)
        return

    # Update quote status
    await update_quote_status(quote_id, "declined", reason)

    # Update lead status
    lead_id = quote_data.get("lead_id")
    if lead_id:
        await update_lead_status(lead_id, "nurture")

    # Notify team
    await notification_service.notify_quote_declined(
        lead_name=quote_data.get("lead_name", "Unknown"),
        company=quote_data.get("lead_company"),
        project_title=quote_data.get("project_title", "Project"),
        reason=reason,
    )


async def _handle_conversation_completed(data: dict):
    """Process conversation completion."""
    conversation_id = data.get("conversation_id")
    logger.info("Conversation completed", conversation_id=conversation_id)

    # Update conversation status
    await update_conversation_status(conversation_id, "completed")
