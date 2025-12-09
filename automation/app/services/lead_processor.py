"""
Lead Processing Service
Handles lead scoring, qualification, and routing
"""

import json
import structlog
from typing import Optional

from openai import AsyncOpenAI

from ..config import settings
from ..models.lead import Lead, LeadScore, LeadQuality, LeadStatus
from ..utils.db import get_db

logger = structlog.get_logger()


class LeadProcessor:
    """Processes and scores leads using AI analysis."""

    def __init__(self):
        self.openai = AsyncOpenAI(api_key=settings.openai_api_key)
        self.db = get_db()

    async def score_lead(self, lead: Lead) -> LeadScore:
        """
        Analyze and score a lead using GPT-4.

        Scoring dimensions (total 100):
        - Interest Level (0-20): How engaged/interested they seem
        - Budget Clarity (0-20): Clear budget vs vague
        - Urgency (0-15): Timeline pressure
        - Problem Clarity (0-20): Well-defined problem vs vague
        - Decision Authority (0-15): Can they make decisions?
        - Tech Readiness (0-10): Technical sophistication
        """
        if not settings.is_openai_configured:
            logger.warning("OpenAI not configured, using rule-based scoring")
            return self._rule_based_score(lead)

        prompt = f"""Analyze this lead and provide a JSON score.

Lead Information:
- Name: {lead.name}
- Company: {lead.company}
- Role: {lead.role or 'Not provided'}
- Industry: {lead.industry or 'Not provided'}
- Company Size: {lead.company_size or 'Not provided'}
- Problem: {lead.problem_text or 'Not provided'}
- Automation Area: {lead.automation_area or 'Not provided'}
- Tools Used: {', '.join(lead.tools_used) if lead.tools_used else 'Not provided'}
- Budget Range: {lead.budget_range or 'Not provided'}
- Timeline: {lead.timeline or 'Not provided'}
- Urgency: {lead.urgency or 'Not provided'}
- Interest Level (self-reported): {lead.interest_level or 'Not provided'}

Score each dimension (be strict but fair):

1. interest_level (0-20): Based on engagement, specificity of questions, follow-through
2. budget_clarity (0-20): Clear budget = 20, vague = 5-10, no budget = 0-5
3. urgency (0-15): "ASAP"/"urgent" = 15, specific date = 10-12, "flexible" = 5
4. problem_clarity (0-20): Detailed problem = 20, generic = 5-10, none = 0
5. decision_authority (0-15): Owner/C-level = 15, Manager = 10, Employee = 5
6. tech_readiness (0-10): Uses modern tools = 10, basic = 5, none mentioned = 2

Respond ONLY with valid JSON:
{{"interest_level": X, "budget_clarity": X, "urgency": X, "problem_clarity": X, "decision_authority": X, "tech_readiness": X}}"""

        try:
            response = await self.openai.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a lead scoring expert. Analyze leads objectively and return JSON scores.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=200,
            )

            content = response.choices[0].message.content or "{}"
            # Extract JSON from response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]

            scores = json.loads(content.strip())

            total = sum(
                [
                    scores.get("interest_level", 0),
                    scores.get("budget_clarity", 0),
                    scores.get("urgency", 0),
                    scores.get("problem_clarity", 0),
                    scores.get("decision_authority", 0),
                    scores.get("tech_readiness", 0),
                ]
            )

            return LeadScore(
                total=min(100, total),
                interest_level=min(20, scores.get("interest_level", 0)),
                budget_clarity=min(20, scores.get("budget_clarity", 0)),
                urgency=min(15, scores.get("urgency", 0)),
                problem_clarity=min(20, scores.get("problem_clarity", 0)),
                decision_authority=min(15, scores.get("decision_authority", 0)),
                tech_readiness=min(10, scores.get("tech_readiness", 0)),
            )

        except Exception as e:
            logger.error("AI scoring failed", error=str(e))
            return self._rule_based_score(lead)

    def _rule_based_score(self, lead: Lead) -> LeadScore:
        """Fallback rule-based scoring when AI is unavailable."""
        scores = {
            "interest_level": 0,
            "budget_clarity": 0,
            "urgency": 0,
            "problem_clarity": 0,
            "decision_authority": 0,
            "tech_readiness": 0,
        }

        # Interest level
        if lead.interest_level:
            scores["interest_level"] = min(20, lead.interest_level * 2)

        # Budget clarity
        if lead.budget_range:
            budget = lead.budget_range.lower()
            if "$" in budget or any(x in budget for x in ["k", "50", "100", "20"]):
                scores["budget_clarity"] = 15
            elif "flexible" in budget or "discuss" in budget:
                scores["budget_clarity"] = 10
            else:
                scores["budget_clarity"] = 5

        # Urgency
        if lead.urgency or lead.timeline:
            text = (lead.urgency or lead.timeline or "").lower()
            if any(x in text for x in ["asap", "urgent", "immediately", "now"]):
                scores["urgency"] = 15
            elif any(x in text for x in ["month", "week", "soon"]):
                scores["urgency"] = 10
            else:
                scores["urgency"] = 5

        # Problem clarity
        if lead.problem_text:
            length = len(lead.problem_text)
            if length > 100:
                scores["problem_clarity"] = 18
            elif length > 50:
                scores["problem_clarity"] = 12
            elif length > 20:
                scores["problem_clarity"] = 8
            else:
                scores["problem_clarity"] = 4

        # Decision authority (based on role)
        if lead.role:
            role = lead.role.lower()
            if any(x in role for x in ["ceo", "cto", "founder", "owner", "director"]):
                scores["decision_authority"] = 15
            elif any(x in role for x in ["manager", "head", "lead", "vp"]):
                scores["decision_authority"] = 10
            else:
                scores["decision_authority"] = 5

        # Tech readiness
        if lead.tools_used and len(lead.tools_used) > 0:
            scores["tech_readiness"] = min(10, len(lead.tools_used) * 3)

        total = sum(scores.values())

        return LeadScore(total=total, **scores)

    async def route_lead(self, lead: Lead, score: LeadScore) -> str:
        """
        Route lead to appropriate workflow based on score.

        Returns the workflow that was triggered.
        """
        logger.info(
            "Routing lead",
            lead_id=lead.id,
            score=score.total,
            quality=score.quality.value,
        )

        # Update lead score in database
        if self.db:
            await self._update_lead_score(lead.id, score)

        if score.quality == LeadQuality.HIGH:
            return await self._handle_qualified_lead(lead, score)
        elif score.quality == LeadQuality.MEDIUM:
            return await self._handle_nurture_lead(lead, score)
        else:
            return await self._handle_low_quality_lead(lead, score)

    async def _update_lead_score(self, lead_id: str, score: LeadScore) -> None:
        """Update lead score in database."""
        try:
            status = (
                LeadStatus.QUALIFIED.value
                if score.quality == LeadQuality.HIGH
                else LeadStatus.NURTURE.value
            )
            await self.db.update(
                "leads",
                {"lead_score": score.total, "status": status},
                "id = %s",
                (lead_id,),
            )
        except Exception as e:
            logger.error("Failed to update lead score", error=str(e))

    async def _handle_qualified_lead(self, lead: Lead, score: LeadScore) -> str:
        """Handle high-quality leads - generate quote and notify team."""
        logger.info("Processing qualified lead", lead_id=lead.id, score=score.total)
        return "qualified_lead_workflow"

    async def _handle_nurture_lead(self, lead: Lead, score: LeadScore) -> str:
        """Handle medium-quality leads - add to nurture sequence."""
        logger.info("Processing nurture lead", lead_id=lead.id, score=score.total)
        return "nurture_workflow"

    async def _handle_low_quality_lead(self, lead: Lead, score: LeadScore) -> str:
        """Handle low-quality leads - polite exit."""
        logger.info("Processing low-quality lead", lead_id=lead.id, score=score.total)
        return "low_quality_workflow"

    async def get_lead(self, lead_id: str) -> Optional[Lead]:
        """Fetch lead from database."""
        if not self.db:
            return None

        try:
            result = await self.db.select_one(
                "leads", where="id = %s", where_params=(lead_id,)
            )
            if result:
                return Lead(**result)
        except Exception as e:
            logger.error("Failed to fetch lead", lead_id=lead_id, error=str(e))

        return None
