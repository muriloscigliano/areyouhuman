"""
Notification Service
Handles Slack, Discord, and other notification channels
"""

from typing import Optional

import httpx
import structlog

from ..config import settings

logger = structlog.get_logger()


class NotificationService:
    """Sends notifications to various channels."""

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=10.0)

    async def send_slack(
        self,
        message: str,
        channel: Optional[str] = None,
        blocks: Optional[list] = None,
    ) -> bool:
        """
        Send a message to Slack.

        Args:
            message: Plain text message
            channel: Override default channel
            blocks: Slack block kit elements for rich formatting

        Returns:
            bool: True if sent successfully
        """
        if not settings.is_slack_configured:
            logger.warning("Slack not configured, skipping notification")
            return False

        try:
            payload = {"text": message}

            if channel:
                payload["channel"] = channel

            if blocks:
                payload["blocks"] = blocks

            response = await self.client.post(
                settings.slack_webhook_url,
                json=payload,
            )

            if response.status_code == 200:
                logger.info("Slack notification sent", message=message[:50])
                return True
            else:
                logger.error(
                    "Slack notification failed",
                    status=response.status_code,
                    response=response.text,
                )
                return False

        except Exception as e:
            logger.error("Slack notification error", error=str(e))
            return False

    async def notify_new_lead(
        self,
        lead_name: str,
        lead_email: str,
        company: Optional[str] = None,
        lead_score: Optional[int] = None,
        automation_area: Optional[str] = None,
    ) -> bool:
        """Send notification for new qualified lead."""
        score_emoji = "🟢" if (lead_score or 0) >= 70 else "🟡" if (lead_score or 0) >= 40 else "🔴"

        blocks = [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": "🎯 New Qualified Lead", "emoji": True},
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Name:*\n{lead_name}"},
                    {"type": "mrkdwn", "text": f"*Company:*\n{company or 'Not provided'}"},
                    {"type": "mrkdwn", "text": f"*Email:*\n{lead_email}"},
                    {
                        "type": "mrkdwn",
                        "text": f"*Score:*\n{score_emoji} {lead_score or 'N/A'}/100",
                    },
                ],
            },
        ]

        if automation_area:
            blocks.append(
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Automation Area:*\n{automation_area}",
                    },
                }
            )

        blocks.append(
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "View in CRM", "emoji": True},
                        "style": "primary",
                        "url": f"https://supabase.com/dashboard",
                    },
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "Send Email", "emoji": True},
                        "url": f"mailto:{lead_email}",
                    },
                ],
            }
        )

        message = f"New lead: {lead_name} from {company or 'Unknown'} (Score: {lead_score or 'N/A'})"
        return await self.send_slack(message, blocks=blocks)

    async def notify_quote_accepted(
        self,
        lead_name: str,
        company: Optional[str],
        project_title: str,
        amount: float,
    ) -> bool:
        """Send notification when quote is accepted."""
        blocks = [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": "🎉 Quote Accepted!", "emoji": True},
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Client:*\n{lead_name}"},
                    {"type": "mrkdwn", "text": f"*Company:*\n{company or 'N/A'}"},
                    {"type": "mrkdwn", "text": f"*Project:*\n{project_title}"},
                    {"type": "mrkdwn", "text": f"*Amount:*\n${amount:,.2f}"},
                ],
            },
            {"type": "divider"},
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "🚀 *Action Required:* Schedule kickoff call within 48 hours",
                },
            },
        ]

        message = f"Quote accepted! {lead_name} - {project_title} (${amount:,.2f})"
        return await self.send_slack(message, blocks=blocks)

    async def notify_quote_declined(
        self,
        lead_name: str,
        company: Optional[str],
        project_title: str,
        reason: Optional[str] = None,
    ) -> bool:
        """Send notification when quote is declined."""
        blocks = [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": "❌ Quote Declined", "emoji": True},
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Client:*\n{lead_name}"},
                    {"type": "mrkdwn", "text": f"*Company:*\n{company or 'N/A'}"},
                    {"type": "mrkdwn", "text": f"*Project:*\n{project_title}"},
                ],
            },
        ]

        if reason:
            blocks.append(
                {
                    "type": "section",
                    "text": {"type": "mrkdwn", "text": f"*Reason:*\n_{reason}_"},
                }
            )

        message = f"Quote declined: {lead_name} - {project_title}"
        return await self.send_slack(message, blocks=blocks)

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
