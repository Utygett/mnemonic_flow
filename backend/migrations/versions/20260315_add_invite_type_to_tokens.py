"""add invite_type column to deck_invite_tokens

Revision ID: 20260315_invite_type
Revises: 20260315_deck_editors_invite
Create Date: 2026-03-15 20:50:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260315_invite_type"
down_revision: Union[str, None] = "20260315_deck_editors_invite"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "deck_invite_tokens",
        sa.Column(
            "invite_type",
            sa.String(16),
            nullable=False,
            server_default="editor",
        ),
    )


def downgrade() -> None:
    op.drop_column("deck_invite_tokens", "invite_type")
