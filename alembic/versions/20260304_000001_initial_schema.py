"""Initial schema

Revision ID: 20260304_000001
Revises:
Create Date: 2026-03-04 00:00:01
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260304_000001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "allowed_emails",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("username", sa.String(length=64), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
    )

    op.create_table(
        "rep_tabs",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "routine_days",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("entry_date", sa.Date(), nullable=False),
        sa.Column("study_seconds", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "entry_date", name="uq_routine_user_date"),
    )

    op.create_table(
        "vocab_english_words",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("text", sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "text", name="uq_vocab_english_user_text"),
    )

    op.create_table(
        "vocab_groups",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "name", name="uq_vocab_group_user_name"),
    )

    op.create_table(
        "vocab_hebrew_words",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("text", sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "text", name="uq_vocab_hebrew_user_text"),
    )

    op.create_table(
        "wakeup_entries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("entry_date", sa.Date(), nullable=False),
        sa.Column("wake_time", sa.Time(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "entry_date", name="uq_wakeup_user_date"),
    )

    op.create_table(
        "weight_entries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("entry_date", sa.Date(), nullable=False),
        sa.Column("weight", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "entry_date", name="uq_weight_user_date"),
    )

    op.create_table(
        "rep_exercises",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("tab_id", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("reps", sa.Integer(), nullable=False),
        sa.Column("step", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["tab_id"], ["rep_tabs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "routine_tasks",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("routine_day_id", sa.Integer(), nullable=False),
        sa.Column("task_id", sa.String(length=8), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("is_timed", sa.Boolean(), nullable=False),
        sa.Column("initial_seconds", sa.Integer(), nullable=False),
        sa.Column("remaining_seconds", sa.Integer(), nullable=False),
        sa.Column("completed", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["routine_day_id"], ["routine_days.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("routine_day_id", "task_id", name="uq_routine_day_task"),
    )

    op.create_table(
        "vocab_packs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["vocab_groups.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "vocab_pack_english_words",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("pack_id", sa.Integer(), nullable=False),
        sa.Column("english_word_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["english_word_id"], ["vocab_english_words.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["pack_id"], ["vocab_packs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("pack_id", "english_word_id", name="uq_vocab_pack_english_word"),
    )

    op.create_table(
        "vocab_pack_hebrew_words",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("pack_id", sa.Integer(), nullable=False),
        sa.Column("hebrew_word_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["hebrew_word_id"], ["vocab_hebrew_words.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["pack_id"], ["vocab_packs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("pack_id", "hebrew_word_id", name="uq_vocab_pack_hebrew_word"),
    )


def downgrade() -> None:
    op.drop_table("vocab_pack_hebrew_words")
    op.drop_table("vocab_pack_english_words")
    op.drop_table("vocab_packs")
    op.drop_table("routine_tasks")
    op.drop_table("rep_exercises")
    op.drop_table("weight_entries")
    op.drop_table("wakeup_entries")
    op.drop_table("vocab_hebrew_words")
    op.drop_table("vocab_groups")
    op.drop_table("vocab_english_words")
    op.drop_table("routine_days")
    op.drop_table("rep_tabs")
    op.drop_table("users")
    op.drop_table("allowed_emails")
