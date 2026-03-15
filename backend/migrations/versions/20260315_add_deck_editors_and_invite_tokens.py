"""add deck_editors and deck_invite_tokens tables

Revision ID: 20260315_deck_editors_invite
Revises: 20250220_show_card_title
Create Date: 2026-03-15 19:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260315_deck_editors_invite"
down_revision: Union[str, None] = "20250220_show_card_title"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- deck_editors ---
    op.create_table(
        "deck_editors",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "deck_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("decks.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "invited_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_deck_editors_deck_id", "deck_editors", ["deck_id"])
    op.create_index("ix_deck_editors_user_id", "deck_editors", ["user_id"])
    # Unique constraint: one user per deck
    op.create_unique_constraint("uq_deck_editors_deck_user", "deck_editors", ["deck_id", "user_id"])

    # --- deck_invite_tokens ---
    op.create_table(
        "deck_invite_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "deck_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("decks.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token", sa.String(64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_deck_invite_tokens_deck_id", "deck_invite_tokens", ["deck_id"])
    op.create_index("ix_deck_invite_tokens_token", "deck_invite_tokens", ["token"], unique=True)


def downgrade() -> None:
    op.drop_table("deck_invite_tokens")
    op.drop_table("deck_editors")
