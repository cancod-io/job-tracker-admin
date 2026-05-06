"""create users jobs applications

Revision ID: 001_users_jobs_applications
Revises:
Create Date: 2026-05-05
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "001_users_jobs_applications"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), server_default="member", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column(
            "job_preferences",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )

    op.create_table(
        "jobs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("source", sa.String(length=64), nullable=False),
        sa.Column("source_job_id", sa.String(length=255), nullable=True),
        sa.Column("apply_url", sa.Text(), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("company_name", sa.String(length=300), nullable=False),
        sa.Column("company_logo_url", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("is_remote", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("job_type", sa.String(length=64), nullable=True),
        sa.Column("experience_level", sa.String(length=64), nullable=True),
        sa.Column(
            "skills",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("shopify_relevance_score", sa.Numeric(5, 4), nullable=True),
        sa.Column("is_long_term", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("normalized_title", sa.String(length=512), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("raw_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("posted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scraped_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_jobs"),
        sa.UniqueConstraint("apply_url", name="uq_jobs_apply_url"),
    )
    op.create_index("ix_jobs_source", "jobs", ["source"], unique=False)
    op.create_index("ix_jobs_source_job_id", "jobs", ["source_job_id"], unique=False)
    op.create_index("ix_jobs_company_name", "jobs", ["company_name"], unique=False)
    op.create_index("ix_jobs_is_remote", "jobs", ["is_remote"], unique=False)
    op.create_index("ix_jobs_job_type", "jobs", ["job_type"], unique=False)
    op.create_index("ix_jobs_experience_level", "jobs", ["experience_level"], unique=False)
    op.create_index("ix_jobs_is_active", "jobs", ["is_active"], unique=False)
    op.create_index("ix_jobs_posted_at", "jobs", ["posted_at"], unique=False)

    op.create_table(
        "applications",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("job_id", sa.BigInteger(), nullable=False),
        sa.Column("status", sa.String(length=32), server_default="saved", nullable=False),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("follow_up_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), server_default="", nullable=False),
        sa.Column("priority", sa.SmallInteger(), server_default="0", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["job_id"],
            ["jobs.id"],
            name="fk_applications_job_id_jobs",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_applications_user_id_users",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_applications"),
        sa.UniqueConstraint("user_id", "job_id", name="uq_applications_user_id_job_id"),
    )
    op.create_index("ix_applications_user_id", "applications", ["user_id"], unique=False)
    op.create_index("ix_applications_job_id", "applications", ["job_id"], unique=False)
    op.create_index("ix_applications_status", "applications", ["status"], unique=False)
    op.create_index(
        "ix_applications_user_id_status",
        "applications",
        ["user_id", "status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_applications_user_id_status", table_name="applications")
    op.drop_index("ix_applications_status", table_name="applications")
    op.drop_index("ix_applications_job_id", table_name="applications")
    op.drop_index("ix_applications_user_id", table_name="applications")
    op.drop_table("applications")

    op.drop_index("ix_jobs_posted_at", table_name="jobs")
    op.drop_index("ix_jobs_is_active", table_name="jobs")
    op.drop_index("ix_jobs_experience_level", table_name="jobs")
    op.drop_index("ix_jobs_job_type", table_name="jobs")
    op.drop_index("ix_jobs_is_remote", table_name="jobs")
    op.drop_index("ix_jobs_company_name", table_name="jobs")
    op.drop_index("ix_jobs_source_job_id", table_name="jobs")
    op.drop_index("ix_jobs_source", table_name="jobs")
    op.drop_table("jobs")

    op.drop_table("users")
