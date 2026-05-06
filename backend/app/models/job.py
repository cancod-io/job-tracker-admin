"""Job ORM — scraped or manually added listings."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, DateTime, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.application import Application


class Job(Base, TimestampMixin):
    """Job listing — title, company, location, salary, description plus scrape metadata."""

    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    source: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    source_job_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    apply_url: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    company: Mapped[str] = mapped_column(
        "company_name",
        String(300),
        nullable=False,
        index=True,
    )
    company_logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    salary: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_remote: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    job_type: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    experience_level: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    skills: Mapped[list[Any]] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'[]'::jsonb"),
    )
    shopify_relevance_score: Mapped[float | None] = mapped_column(Numeric(5, 4), nullable=True)
    is_long_term: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    normalized_title: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    raw_payload: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    posted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )
    scraped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    applications: Mapped[list[Application]] = relationship(
        "Application",
        back_populates="job",
        cascade="all, delete-orphan",
    )
