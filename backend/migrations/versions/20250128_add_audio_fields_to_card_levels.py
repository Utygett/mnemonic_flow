"""add audio fields to card_levels

Revision ID: 20250128_add_audio
Revises: cc8bab2b37cb
Create Date: 2026-01-28 17:25:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20250128_add_audio"
down_revision: Union[str, Sequence[str], None] = "cc8bab2b37cb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: add audio fields to card_levels table."""
    # Add audio columns to card_levels table
    op.add_column("card_levels", sa.Column("question_audio_url", sa.String(), nullable=True))
    op.add_column("card_levels", sa.Column("question_audio_name", sa.String(), nullable=True))
    op.add_column("card_levels", sa.Column("answer_audio_url", sa.String(), nullable=True))
    op.add_column("card_levels", sa.Column("answer_audio_name", sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema: remove audio fields from card_levels table."""
    op.drop_column("card_levels", "answer_audio_name")
    op.drop_column("card_levels", "answer_audio_url")
    op.drop_column("card_levels", "question_audio_name")
    op.drop_column("card_levels", "question_audio_url")
