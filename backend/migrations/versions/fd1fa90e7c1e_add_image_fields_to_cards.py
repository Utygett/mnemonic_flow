"""add image fields to cards

Revision ID: fd1fa90e7c1e
Revises:
Create Date: 2026-01-23 11:03:51.920458

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "fd1fa90e7c1e"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("cards", sa.Column("question_image_url", sa.String(), nullable=True))
    op.add_column("cards", sa.Column("question_image_name", sa.String(), nullable=True))
    op.add_column("cards", sa.Column("answer_image_url", sa.String(), nullable=True))
    op.add_column("cards", sa.Column("answer_image_name", sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("cards", "answer_image_name")
    op.drop_column("cards", "answer_image_url")
    op.drop_column("cards", "question_image_name")
    op.drop_column("cards", "question_image_url")
