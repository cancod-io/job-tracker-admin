"""Scraper runtime logs for monitoring, retries, and incident triage."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ScraperLog(Base):
    __tablename__ = "scraper_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    scraper_name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration: Mapped[float | None] = mapped_column(Float, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
        index=True,
    )
