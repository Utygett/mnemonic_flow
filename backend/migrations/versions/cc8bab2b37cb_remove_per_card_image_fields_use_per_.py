"""remove per-card image fields, use per-level only

Revision ID: cc8bab2b37cb
Revises: 4557cdb9e28f
Create Date: 2026-01-28 15:22:54.688057

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "cc8bab2b37cb"
down_revision: Union[str, Sequence[str], None] = "4557cdb9e28f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: remove per-card image fields."""
    # Drop columns from cards table
    op.drop_column("cards", "question_image_url")
    op.drop_column("cards", "question_image_name")
    op.drop_column("cards", "answer_image_url")
    op.drop_column("cards", "answer_image_name")


def downgrade() -> None:
    """Downgrade schema: restore per-card image fields."""
    op.add_column("cards", sa.Column("answer_image_name", sa.String(), nullable=True))
    op.add_column("cards", sa.Column("answer_image_url", sa.String(), nullable=True))
    op.add_column("cards", sa.Column("question_image_name", sa.String(), nullable=True))
    op.add_column("cards", sa.Column("question_image_url", sa.String(), nullable=True))
