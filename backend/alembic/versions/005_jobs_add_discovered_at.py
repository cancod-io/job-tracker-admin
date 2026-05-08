"""add discovered_at timestamp to jobs

Revision ID: 005_jobs_add_discovered_at
Revises: 004_roles_logs_job_dupes
Create Date: 2026-05-07
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "005_jobs_add_discovered_at"
down_revision = "004_roles_logs_job_dupes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "jobs",
        sa.Column(
            "discovered_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_jobs_discovered_at", "jobs", ["discovered_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_jobs_discovered_at", table_name="jobs")
    op.drop_column("jobs", "discovered_at")
