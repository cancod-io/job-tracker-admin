"""add optional salary to jobs

Revision ID: 002_jobs_add_salary
Revises: 001_users_jobs_applications
Create Date: 2026-05-05
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "002_jobs_add_salary"
down_revision = "001_users_jobs_applications"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "jobs",
        sa.Column("salary", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("jobs", "salary")
