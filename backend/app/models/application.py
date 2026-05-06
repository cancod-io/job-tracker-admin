"""Application ORM — one row per user per job (pipeline / status tracking)."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, SmallInteger, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import ApplicationStatus

_application_status_pg = PG_ENUM(
    ApplicationStatus,
    name="application_status",
    create_type=False,
    values_callable=lambda enums: [e.value for e in enums],
)

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.user import User


class Application(Base, TimestampMixin):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_applications_user_id_job_id"),
        Index("ix_applications_user_id_status", "user_id", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        _application_status_pg,
        nullable=False,
        server_default=text("'new'::application_status"),
        default=ApplicationStatus.NEW,
        index=True,
    )
    applied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    follow_up_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    priority: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)

    user: Mapped[User] = relationship("User", back_populates="applications")
    job: Mapped[Job] = relationship("Job", back_populates="applications")
