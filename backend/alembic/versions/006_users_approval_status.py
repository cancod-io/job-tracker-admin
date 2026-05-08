"""add user approval status for admin review queue

Revision ID: 006_users_approval_status
Revises: 005_jobs_add_discovered_at
Create Date: 2026-05-08
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM

revision = "006_users_approval_status"
down_revision = "005_jobs_add_discovered_at"
branch_labels = None
depends_on = None


def upgrade() -> None:
    approval_pg = PG_ENUM(
        "pending",
        "approved",
        "rejected",
        name="user_approval_status",
        create_constraint=True,
    )
    bind = op.get_bind()
    approval_pg.create(bind, checkfirst=True)

    op.add_column(
        "users",
        sa.Column(
            "approval_status",
            postgresql.ENUM(
                "pending",
                "approved",
                "rejected",
                name="user_approval_status",
                create_type=False,
            ),
            nullable=False,
            server_default=sa.text("'approved'::user_approval_status"),
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "approval_status")
    op.execute(sa.text("DROP TYPE IF EXISTS user_approval_status"))
