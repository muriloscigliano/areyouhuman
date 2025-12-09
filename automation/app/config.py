"""
Configuration Management
Centralizes all environment variables and settings

Updated: Now uses Neon PostgreSQL instead of Supabase
"""

from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "Are You Human? Automation"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = Field(default="development", alias="ENVIRONMENT")

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database (Neon PostgreSQL)
    database_url: str = Field(default="", alias="DATABASE_URL")

    # OpenAI
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_model: str = "gpt-4o-mini"

    # Email (Resend)
    resend_api_key: str = Field(default="", alias="RESEND_API_KEY")
    from_email: str = Field(default="noreply@areyouhuman.com", alias="FROM_EMAIL")
    team_notification_email: Optional[str] = Field(
        default=None, alias="TEAM_NOTIFICATION_EMAIL"
    )

    # Webhooks
    webhook_secret: str = Field(default="", alias="WEBHOOK_SECRET")
    astro_webhook_url: str = Field(default="", alias="ASTRO_WEBHOOK_URL")

    # Slack
    slack_webhook_url: Optional[str] = Field(default=None, alias="SLACK_WEBHOOK_URL")
    slack_channel: str = "#leads"

    # Lead Scoring
    qualified_lead_threshold: int = 70
    nurture_lead_threshold: int = 40

    # PDF Generation
    pdf_template_dir: str = "templates"

    @property
    def is_database_configured(self) -> bool:
        return bool(self.database_url and "placeholder" not in self.database_url)

    @property
    def is_openai_configured(self) -> bool:
        return bool(self.openai_api_key)

    @property
    def is_resend_configured(self) -> bool:
        return bool(self.resend_api_key)

    @property
    def is_slack_configured(self) -> bool:
        return bool(self.slack_webhook_url)


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Convenience accessor
settings = get_settings()
