"""companies partial unique jobs source application_status enum

Revision ID: 003_comp_jobs_enum
Revises: 002_jobs_add_salary
Create Date: 2026-05-05
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM

revision = "003_comp_jobs_enum"
down_revision = "002_jobs_add_salary"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=300), nullable=False),
        sa.Column("slug", sa.String(length=320), nullable=True),
        sa.Column("website", sa.Text(), nullable=True),
        sa.Column("logo_url", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column(
            "metadata",
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
        sa.PrimaryKeyConstraint("id", name="pk_companies"),
        sa.UniqueConstraint("slug", name="uq_companies_slug"),
    )
    op.create_index("ix_companies_name", "companies", ["name"], unique=False)

    op.add_column("jobs", sa.Column("company_id", sa.BigInteger(), nullable=True))
    op.create_index("ix_jobs_company_id", "jobs", ["company_id"], unique=False)
    op.create_foreign_key(
        "fk_jobs_company_id_companies",
        "jobs",
        "companies",
        ["company_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_index(
        "uq_jobs_source_source_job_id",
        "jobs",
        ["source", "source_job_id"],
        unique=True,
        postgresql_where=sa.text("source_job_id IS NOT NULL"),
    )

    op.execute(sa.text('ALTER TABLE jobs RENAME CONSTRAINT uq_jobs_apply_url TO uq_jobs_source_url'))

    application_status_pg = PG_ENUM(
        "new",
        "applied",
        "interviewing",
        "rejected",
        name="application_status",
    )
    bind = op.get_bind()
    application_status_pg.create(bind, checkfirst=True)

    op.execute(
        sa.text(
            """UPDATE applications SET status =
            CASE status::text
                WHEN 'saved' THEN 'new'
                WHEN 'applied' THEN 'applied'
                WHEN 'interview' THEN 'interviewing'
                WHEN 'offer' THEN 'interviewing'
                WHEN 'rejected' THEN 'rejected'
                WHEN 'withdrawn' THEN 'rejected'
                ELSE 'new'
            END"""
        ),
    )

    op.execute(sa.text('ALTER TABLE applications ALTER COLUMN status DROP DEFAULT'))
    op.execute(
        sa.text(
            """ALTER TABLE applications
            ALTER COLUMN status TYPE application_status
            USING (
                CASE status::text
                    WHEN 'new' THEN 'new'::application_status
                    WHEN 'applied' THEN 'applied'::application_status
                    WHEN 'interviewing' THEN 'interviewing'::application_status
                    WHEN 'rejected' THEN 'rejected'::application_status
                    ELSE 'new'::application_status
                END
            )""",
        ),
    )
    op.execute(sa.text('ALTER TABLE applications ALTER COLUMN status SET DEFAULT \'new\'::application_status'))


def downgrade() -> None:
    op.execute(sa.text('ALTER TABLE applications ALTER COLUMN status DROP DEFAULT'))
    op.execute(
        sa.text(
            "ALTER TABLE applications ALTER COLUMN status TYPE VARCHAR(32) USING (status::text)",
        ),
    )
    application_status_pg = PG_ENUM(
        "new",
        "applied",
        "interviewing",
        "rejected",
        name="application_status",
    )
    application_status_pg.drop(op.get_bind(), checkfirst=True)
    op.execute(sa.text('ALTER TABLE applications ALTER COLUMN status SET DEFAULT \'saved\''))

    op.execute(sa.text('ALTER TABLE jobs RENAME CONSTRAINT uq_jobs_source_url TO uq_jobs_apply_url'))

    op.drop_index("uq_jobs_source_source_job_id", table_name="jobs")

    op.drop_constraint("fk_jobs_company_id_companies", "jobs", type_="foreignkey")
    op.drop_index("ix_jobs_company_id", table_name="jobs")
    op.drop_column("jobs", "company_id")

    op.drop_index("ix_companies_name", table_name="companies")
    op.drop_table("companies")
