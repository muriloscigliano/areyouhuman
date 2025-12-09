"""
Quote Generator Service
Generates PDF quotes from lead data
"""

from datetime import datetime, timedelta
from typing import List, Optional

import structlog
from jinja2 import Environment, FileSystemLoader, select_autoescape

from ..config import settings
from ..models.lead import Lead
from ..models.quote import Quote, QuoteCreate, QuoteItem, QuoteStatus

logger = structlog.get_logger()


class QuoteGenerator:
    """Generates quotes and PDFs from lead data."""

    def __init__(self):
        self.template_env = Environment(
            loader=FileSystemLoader(settings.pdf_template_dir),
            autoescape=select_autoescape(["html", "xml"]),
        )

    async def generate_quote(self, lead: Lead) -> QuoteCreate:
        """
        Generate a quote based on lead information.

        Uses AI to analyze the lead's requirements and generate
        appropriate scope items and pricing.
        """
        logger.info("Generating quote", lead_id=lead.id, lead_name=lead.name)

        # Analyze lead and generate scope items
        scope_items = await self._generate_scope_items(lead)

        # Create quote
        quote = QuoteCreate(
            lead_id=lead.id,
            project_title=self._generate_project_title(lead),
            project_summary=lead.problem_text or "AI Automation Project",
            scope_items=scope_items,
            valid_days=30,
        )

        logger.info(
            "Quote generated",
            lead_id=lead.id,
            total_items=len(scope_items),
            total_amount=sum(item.amount for item in scope_items),
        )

        return quote

    async def _generate_scope_items(self, lead: Lead) -> List[QuoteItem]:
        """Generate scope items based on lead's automation needs."""
        items: List[QuoteItem] = []

        # Base discovery item
        items.append(
            QuoteItem(
                title="Discovery & Planning",
                description="Requirements gathering, workflow analysis, and technical architecture planning",
                amount=2500.00,
                hours=16,
            )
        )

        # Automation area specific items
        if lead.automation_area:
            area = lead.automation_area.lower()

            if any(x in area for x in ["chatbot", "ai", "assistant", "bot"]):
                items.append(
                    QuoteItem(
                        title="AI Chatbot Development",
                        description="Custom AI chatbot with natural language processing, trained on your business data",
                        amount=8500.00,
                        hours=40,
                    )
                )

            if any(x in area for x in ["workflow", "process", "automation"]):
                items.append(
                    QuoteItem(
                        title="Workflow Automation",
                        description="End-to-end process automation with integrations, error handling, and monitoring",
                        amount=6500.00,
                        hours=32,
                    )
                )

            if any(x in area for x in ["integration", "api", "sync", "connect"]):
                items.append(
                    QuoteItem(
                        title="System Integration",
                        description="API integrations between your existing tools and platforms",
                        amount=4500.00,
                        hours=24,
                    )
                )

            if any(x in area for x in ["data", "report", "analytics", "dashboard"]):
                items.append(
                    QuoteItem(
                        title="Data & Analytics",
                        description="Automated reporting, data pipeline, and analytics dashboard",
                        amount=5500.00,
                        hours=28,
                    )
                )

        # If no specific items, add generic automation item
        if len(items) == 1:
            items.append(
                QuoteItem(
                    title="Custom Automation Solution",
                    description="Tailored automation solution based on your specific requirements",
                    amount=7500.00,
                    hours=36,
                )
            )

        # Add testing & deployment
        items.append(
            QuoteItem(
                title="Testing & Deployment",
                description="Quality assurance, user acceptance testing, and production deployment",
                amount=2000.00,
                hours=12,
            )
        )

        # Add support package
        items.append(
            QuoteItem(
                title="30-Day Support",
                description="Post-launch support, bug fixes, and minor adjustments",
                amount=1500.00,
                unit="fixed",
            )
        )

        return items

    def _generate_project_title(self, lead: Lead) -> str:
        """Generate a project title from lead data."""
        if lead.automation_area:
            area = lead.automation_area.title()
            return f"{area} Automation for {lead.company or 'Client'}"

        return f"AI Automation Project for {lead.company or 'Client'}"

    async def generate_pdf(self, quote: Quote, lead: Lead) -> bytes:
        """Generate PDF from quote data."""
        logger.info("Generating PDF", quote_id=quote.id)

        try:
            # Try to use weasyprint for PDF generation
            from weasyprint import HTML

            html_content = self._render_quote_html(quote, lead)
            pdf_bytes = HTML(string=html_content).write_pdf()

            logger.info("PDF generated successfully", quote_id=quote.id, size=len(pdf_bytes))
            return pdf_bytes

        except ImportError:
            logger.warning("weasyprint not available, returning HTML as fallback")
            return self._render_quote_html(quote, lead).encode("utf-8")

        except Exception as e:
            logger.error("PDF generation failed", quote_id=quote.id, error=str(e))
            raise

    def _render_quote_html(self, quote: Quote, lead: Lead) -> str:
        """Render quote as HTML."""
        # Calculate totals
        subtotal = sum(item.amount for item in quote.scope_items)
        tax = subtotal * 0.1  # 10% GST
        total = subtotal + tax

        # Format dates
        created_date = quote.created_at.strftime("%B %d, %Y")
        valid_until = quote.valid_until.strftime("%B %d, %Y")

        # Render items
        items_html = ""
        for item in quote.scope_items:
            hours_text = f" ({item.hours} hours)" if item.hours else ""
            items_html += f"""
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <strong>{item.title}</strong><br>
                    <span style="color: #6b7280; font-size: 14px;">{item.description}</span>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    ${item.amount:,.2f}{hours_text}
                </td>
            </tr>
            """

        return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quote - {quote.project_title}</title>
    <style>
        @page {{ size: A4; margin: 2cm; }}
        body {{ font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; line-height: 1.5; }}
        .header {{ display: flex; justify-content: space-between; margin-bottom: 40px; }}
        .logo {{ font-size: 24px; font-weight: bold; color: #fb6400; }}
        .quote-info {{ text-align: right; }}
        .client-info {{ margin-bottom: 30px; }}
        .section {{ margin-bottom: 30px; }}
        .section-title {{ font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #374151; }}
        table {{ width: 100%; border-collapse: collapse; }}
        th {{ background: #f9fafb; padding: 12px; text-align: left; font-weight: 600; }}
        .totals {{ margin-top: 20px; text-align: right; }}
        .totals table {{ width: 300px; margin-left: auto; }}
        .totals td {{ padding: 8px; }}
        .total-row {{ font-size: 18px; font-weight: bold; background: #fb6400; color: white; }}
        .footer {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }}
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Are You Human?</div>
        <div class="quote-info">
            <strong>Quote</strong><br>
            Date: {created_date}<br>
            Valid Until: {valid_until}
        </div>
    </div>

    <div class="client-info">
        <strong>Prepared For:</strong><br>
        {lead.name}<br>
        {lead.company or ''}<br>
        {lead.email}
    </div>

    <div class="section">
        <div class="section-title">{quote.project_title}</div>
        <p>{quote.project_summary}</p>
    </div>

    <div class="section">
        <div class="section-title">Scope of Work</div>
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                {items_html}
            </tbody>
        </table>
    </div>

    <div class="totals">
        <table>
            <tr>
                <td>Subtotal:</td>
                <td style="text-align: right;">${subtotal:,.2f}</td>
            </tr>
            <tr>
                <td>GST (10%):</td>
                <td style="text-align: right;">${tax:,.2f}</td>
            </tr>
            <tr class="total-row">
                <td style="padding: 12px;">Total ({quote.currency}):</td>
                <td style="text-align: right; padding: 12px;">${total:,.2f}</td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <p><strong>Terms & Conditions:</strong></p>
        <ul>
            <li>50% deposit required to commence work</li>
            <li>Balance due upon project completion</li>
            <li>Quote valid for 30 days</li>
            <li>Prices exclude any third-party software licenses</li>
        </ul>
        <p style="margin-top: 20px;">
            <strong>Are You Human?</strong> | AI-Powered Automation Consulting<br>
            areyouhuman.com
        </p>
    </div>
</body>
</html>"""
