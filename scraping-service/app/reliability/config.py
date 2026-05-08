"""Defaults for reliable HTTP fetching."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class ReliabilitySettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="SCRAPE_HTTP_", extra="ignore")

    default_min_interval_sec: float = 1.0
    user_agent: str = "ShopifyJobTrackerBot/1.0 (+https://example.com/bot)"
    request_timeout_sec: float = 30.0
    max_retries: int = 3
    backoff_multiplier: float = 1.0
    backoff_min_sec: float = 1.0
    backoff_max_sec: float = 120.0


settings = ReliabilitySettings()
