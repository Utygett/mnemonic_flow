"""add_image_fields_to_card_levels

Revision ID: 4557cdb9e28f
Revises: fd1fa90e7c1e
Create Date: 2026-01-23 11:05:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "4557cdb9e28f"
down_revision: Union[str, None] = "fd1fa90e7c1e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add image columns to card_levels table
    op.add_column("card_levels", sa.Column("question_image_url", sa.String(), nullable=True))
    op.add_column("card_levels", sa.Column("question_image_name", sa.String(), nullable=True))
    op.add_column("card_levels", sa.Column("answer_image_url", sa.String(), nullable=True))
    op.add_column("card_levels", sa.Column("answer_image_name", sa.String(), nullable=True))


def downgrade() -> None:
    # Remove image columns from card_levels table
    op.drop_column("card_levels", "answer_image_name")
    op.drop_column("card_levels", "answer_image_url")
    op.drop_column("card_levels", "question_image_name")
    op.drop_column("card_levels", "question_image_url")
