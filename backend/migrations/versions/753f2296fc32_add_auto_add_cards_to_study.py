"""add_auto_add_cards_to_study

Revision ID: 753f2296fc32
Revises: 20260315_invite_type
Create Date: 2026-04-04 21:00:29.537334

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "753f2296fc32"
down_revision: Union[str, Sequence[str], None] = "20260315_invite_type"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Check if column already exists (from manual DB update)
    from sqlalchemy import inspect

    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col["name"] for col in inspector.get_columns("decks")]

    if "auto_add_cards_to_study" not in columns:
        op.add_column(
            "decks",
            sa.Column(
                "auto_add_cards_to_study", sa.Boolean(), nullable=False, server_default="false"
            ),
        )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("decks", "auto_add_cards_to_study")
