"""roles enum logs tables and duplicate-job tracking

Revision ID: 004_roles_logs_job_dupes
Revises: 003_comp_jobs_enum
Create Date: 2026-05-07
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM

revision = "004_roles_logs_job_dupes"
down_revision = "003_comp_jobs_enum"
branch_labels = None
depends_on = None


def upgrade() -> None:
    user_role_pg = PG_ENUM(
        "admin",
        "moderator",
        "user",
        name="user_role",
    )
    bind = op.get_bind()
    user_role_pg.create(bind, checkfirst=True)

    op.execute(sa.text("UPDATE users SET role = 'user' WHERE role = 'member'"))
    op.execute(sa.text("UPDATE users SET role = 'user' WHERE role NOT IN ('admin', 'moderator', 'user')"))
    op.execute(sa.text("ALTER TABLE users ALTER COLUMN role DROP DEFAULT"))
    op.execute(
        sa.text(
            """ALTER TABLE users
            ALTER COLUMN role TYPE user_role
            USING (
                CASE role::text
                    WHEN 'admin' THEN 'admin'::user_role
                    WHEN 'moderator' THEN 'moderator'::user_role
                    ELSE 'user'::user_role
                END
            )""",
        ),
    )
    op.execute(sa.text("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'::user_role"))

    op.add_column(
        "jobs",
        sa.Column("is_duplicate", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.add_column("jobs", sa.Column("original_job_id", sa.BigInteger(), nullable=True))
    op.create_index("ix_jobs_is_duplicate", "jobs", ["is_duplicate"], unique=False)
    op.create_index("ix_jobs_original_job_id", "jobs", ["original_job_id"], unique=False)
    op.create_foreign_key(
        "fk_jobs_original_job_id_jobs",
        "jobs",
        "jobs",
        ["original_job_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "scraper_logs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("scraper_name", sa.String(length=120), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("duration", sa.Float(), nullable=True),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_scraper_logs"),
    )
    op.create_index("ix_scraper_logs_scraper_name", "scraper_logs", ["scraper_name"], unique=False)
    op.create_index("ix_scraper_logs_status", "scraper_logs", ["status"], unique=False)
    op.create_index("ix_scraper_logs_timestamp", "scraper_logs", ["timestamp"], unique=False)

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("actor_user_id", sa.BigInteger(), nullable=True),
        sa.Column("action", sa.String(length=120), nullable=False),
        sa.Column("target_type", sa.String(length=80), nullable=True),
        sa.Column("target_id", sa.String(length=120), nullable=True),
        sa.Column(
            "details",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("ip_address", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["actor_user_id"],
            ["users.id"],
            name="fk_audit_logs_actor_user_id_users",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_audit_logs"),
    )
    op.create_index("ix_audit_logs_actor_user_id", "audit_logs", ["actor_user_id"], unique=False)
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"], unique=False)
    op.create_index("ix_audit_logs_target_type", "audit_logs", ["target_type"], unique=False)
    op.create_index("ix_audit_logs_timestamp", "audit_logs", ["timestamp"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_audit_logs_timestamp", table_name="audit_logs")
    op.drop_index("ix_audit_logs_target_type", table_name="audit_logs")
    op.drop_index("ix_audit_logs_action", table_name="audit_logs")
    op.drop_index("ix_audit_logs_actor_user_id", table_name="audit_logs")
    op.drop_table("audit_logs")

    op.drop_index("ix_scraper_logs_timestamp", table_name="scraper_logs")
    op.drop_index("ix_scraper_logs_status", table_name="scraper_logs")
    op.drop_index("ix_scraper_logs_scraper_name", table_name="scraper_logs")
    op.drop_table("scraper_logs")

    op.drop_constraint("fk_jobs_original_job_id_jobs", "jobs", type_="foreignkey")
    op.drop_index("ix_jobs_original_job_id", table_name="jobs")
    op.drop_index("ix_jobs_is_duplicate", table_name="jobs")
    op.drop_column("jobs", "original_job_id")
    op.drop_column("jobs", "is_duplicate")

    op.execute(sa.text("ALTER TABLE users ALTER COLUMN role DROP DEFAULT"))
    op.execute(sa.text("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20) USING (role::text)"))
    op.execute(sa.text("UPDATE users SET role = 'member' WHERE role = 'user'"))
    op.execute(sa.text("UPDATE users SET role = 'member' WHERE role = 'moderator'"))
    op.execute(sa.text("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'member'"))
    user_role_pg = PG_ENUM(
        "admin",
        "moderator",
        "user",
        name="user_role",
    )
    user_role_pg.drop(op.get_bind(), checkfirst=True)
