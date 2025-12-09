"""
Email Service
Handles all email sending via Resend
"""

from typing import List, Optional

import resend
import structlog

from ..config import settings

logger = structlog.get_logger()


class EmailService:
    """Sends emails via Resend API."""

    def __init__(self):
        if settings.is_resend_configured:
            resend.api_key = settings.resend_api_key

    async def send(
        self,
        to: str,
        subject: str,
        html: str,
        text: Optional[str] = None,
        attachments: Optional[List[dict]] = None,
        reply_to: Optional[str] = None,
    ) -> bool:
        """
        Send an email via Resend.

        Args:
            to: Recipient email address
            subject: Email subject
            html: HTML content
            text: Plain text content (optional)
            attachments: List of attachments [{"filename": "...", "content": b"..."}]
            reply_to: Reply-to address

        Returns:
            bool: True if sent successfully
        """
        if not settings.is_resend_configured:
            logger.warning("Resend not configured, skipping email", to=to, subject=subject)
            return False

        try:
            params = {
                "from": settings.from_email,
                "to": [to],
                "subject": subject,
                "html": html,
            }

            if text:
                params["text"] = text

            if reply_to:
                params["reply_to"] = reply_to

            if attachments:
                params["attachments"] = attachments

            result = resend.Emails.send(params)
            logger.info("Email sent", to=to, subject=subject, id=result.get("id"))
            return True

        except Exception as e:
            logger.error("Failed to send email", to=to, subject=subject, error=str(e))
            return False

    async def send_welcome(
        self,
        to: str,
        name: str,
        company: Optional[str] = None,
        automation_area: Optional[str] = None,
        problem_text: Optional[str] = None,
    ) -> bool:
        """Send welcome email to new lead."""
        html = self._generate_welcome_html(name, company, automation_area, problem_text)
        return await self.send(
            to=to,
            subject="🤖 Your Automation Project - Next Steps",
            html=html,
        )

    async def send_quote(
        self,
        to: str,
        name: str,
        project_title: str,
        pdf_content: Optional[bytes] = None,
        quote_url: Optional[str] = None,
    ) -> bool:
        """Send quote to lead."""
        html = self._generate_quote_html(name, project_title, quote_url)

        attachments = None
        if pdf_content:
            attachments = [
                {
                    "filename": f"{project_title.replace(' ', '_')}_Quote.pdf",
                    "content": pdf_content,
                }
            ]

        return await self.send(
            to=to,
            subject=f"📋 Your Quote: {project_title}",
            html=html,
            attachments=attachments,
        )

    async def send_team_notification(
        self,
        lead_name: str,
        lead_email: str,
        company: Optional[str] = None,
        project_summary: Optional[str] = None,
        lead_score: Optional[int] = None,
    ) -> bool:
        """Send notification to team about new qualified lead."""
        if not settings.team_notification_email:
            logger.info("Team notification email not configured, skipping")
            return False

        html = self._generate_team_notification_html(
            lead_name, lead_email, company, project_summary, lead_score
        )

        return await self.send(
            to=settings.team_notification_email,
            subject=f"🎯 New Lead: {lead_name} from {company or 'Unknown'}",
            html=html,
        )

    def _generate_welcome_html(
        self,
        name: str,
        company: Optional[str],
        automation_area: Optional[str],
        problem_text: Optional[str],
    ) -> str:
        """Generate welcome email HTML."""
        problem_section = ""
        if problem_text:
            problem_section = f"""
            <div style="background: #fff7ed; border-left: 4px solid #fb6400; padding: 16px; margin: 16px 0;">
                <p><strong>Your Challenge:</strong><br>
                <em>"{problem_text}"</em></p>
            </div>
            """

        return f"""<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #fb6400 0%, #ff7a1a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }}
        .content {{ background: #f8fafc; padding: 30px; border-radius: 8px; margin-top: 20px; }}
        .footer {{ text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Thanks for Connecting!</h1>
    </div>
    <div class="content">
        <p>Hi {name},</p>
        <p>Thanks for chatting with Telos! I've passed your project details to our team, and they're already analyzing how we can help you with <strong>{automation_area or 'your automation needs'}</strong>.</p>
        <p><strong>What happens next?</strong></p>
        <ul>
            <li>📊 We're analyzing your requirements</li>
            <li>💰 Calculating ROI and pricing</li>
            <li>📝 Preparing a custom proposal</li>
        </ul>
        {problem_section}
        <p>You'll receive a detailed proposal within 24 hours!</p>
        <p>Best,<br><strong>The Are You Human? Team</strong></p>
    </div>
    <div class="footer">
        <p>Are You Human? | AI-Powered Automation</p>
    </div>
</body>
</html>"""

    def _generate_quote_html(
        self, name: str, project_title: str, quote_url: Optional[str]
    ) -> str:
        """Generate quote email HTML."""
        cta = ""
        if quote_url:
            cta = f"""
            <p style="text-align: center;">
                <a href="{quote_url}" style="display: inline-block; background: #fb6400; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Your Quote</a>
            </p>
            """

        return f"""<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }}
        .content {{ background: #f8fafc; padding: 30px; border-radius: 8px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Your Quote is Ready!</h1>
    </div>
    <div class="content">
        <p>Hi {name},</p>
        <p>Your quote for <strong>{project_title}</strong> is ready.</p>
        {cta}
        <p>This quote includes:</p>
        <ul>
            <li>📋 Detailed project scope</li>
            <li>⏱️ Timeline estimates</li>
            <li>💰 Investment breakdown</li>
            <li>🚀 Next steps</li>
        </ul>
        <p>Reply to this email with any questions!</p>
        <p>Best,<br><strong>The Are You Human? Team</strong></p>
    </div>
</body>
</html>"""

    def _generate_team_notification_html(
        self,
        lead_name: str,
        lead_email: str,
        company: Optional[str],
        project_summary: Optional[str],
        lead_score: Optional[int],
    ) -> str:
        """Generate team notification HTML."""
        return f"""<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }}
        .content {{ background: #f0fdf4; padding: 30px; border-radius: 8px; margin-top: 20px; }}
        table {{ width: 100%; border-collapse: collapse; }}
        td {{ padding: 8px; border-bottom: 1px solid #e0e0e0; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 New Qualified Lead</h1>
    </div>
    <div class="content">
        <table>
            <tr><td><strong>Name:</strong></td><td>{lead_name}</td></tr>
            <tr><td><strong>Email:</strong></td><td><a href="mailto:{lead_email}">{lead_email}</a></td></tr>
            <tr><td><strong>Company:</strong></td><td>{company or 'Not provided'}</td></tr>
            <tr><td><strong>Lead Score:</strong></td><td>{lead_score or 'N/A'}/100</td></tr>
        </table>
        {f'<div style="background: #fff7ed; border-left: 4px solid #fb6400; padding: 16px; margin-top: 16px;"><p><strong>Project:</strong></p><p>{project_summary}</p></div>' if project_summary else ''}
        <p style="margin-top: 16px;"><strong>Action Required:</strong> Review and respond within 24 hours.</p>
    </div>
</body>
</html>"""
