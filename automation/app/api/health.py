"""Health check endpoints."""

from datetime import datetime

from fastapi import APIRouter

from ..config import settings

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/ready")
async def readiness_check():
    """Readiness check with dependency status."""
    return {
        "status": "ready",
        "dependencies": {
            "supabase": settings.is_supabase_configured,
            "openai": settings.is_openai_configured,
            "resend": settings.is_resend_configured,
            "slack": settings.is_slack_configured,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }
