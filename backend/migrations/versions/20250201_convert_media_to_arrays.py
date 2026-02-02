"""convert media to arrays

Revision ID: 20250201_media_arrays
Revises: 20250128_add_audio
Create Date: 2026-02-01 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ARRAY

# revision identifiers, used by Alembic.
revision: str = "20250201_media_arrays"
down_revision: Union[str, Sequence[str], None] = "20250128_add_audio"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: convert single URL columns to arrays."""
    # Add new array columns
    op.add_column(
        "card_levels",
        sa.Column("question_image_urls", ARRAY(sa.String()), nullable=True),
    )
    op.add_column(
        "card_levels",
        sa.Column("answer_image_urls", ARRAY(sa.String()), nullable=True),
    )
    op.add_column(
        "card_levels",
        sa.Column("question_audio_urls", ARRAY(sa.String()), nullable=True),
    )
    op.add_column(
        "card_levels",
        sa.Column("answer_audio_urls", ARRAY(sa.String()), nullable=True),
    )

    # Migrate existing single values to arrays
    op.execute("""
        UPDATE card_levels
        SET question_image_urls = CASE WHEN question_image_url IS NOT NULL
            THEN ARRAY[question_image_url] ELSE NULL END,
            answer_image_urls = CASE WHEN answer_image_url IS NOT NULL
            THEN ARRAY[answer_image_url] ELSE NULL END,
            question_audio_urls = CASE WHEN question_audio_url IS NOT NULL
            THEN ARRAY[question_audio_url] ELSE NULL END,
            answer_audio_urls = CASE WHEN answer_audio_url IS NOT NULL
            THEN ARRAY[answer_audio_url] ELSE NULL END
    """)

    # Drop old columns
    op.drop_column("card_levels", "question_image_url")
    op.drop_column("card_levels", "answer_image_url")
    op.drop_column("card_levels", "question_audio_url")
    op.drop_column("card_levels", "answer_audio_url")


def downgrade() -> None:
    """Downgrade schema: revert arrays back to single URL columns."""
    # Add back old single columns
    op.add_column(
        "card_levels",
        sa.Column("question_audio_url", sa.String(), nullable=True),
    )
    op.add_column(
        "card_levels",
        sa.Column("answer_audio_url", sa.String(), nullable=True),
    )
    op.add_column(
        "card_levels",
        sa.Column("question_image_url", sa.String(), nullable=True),
    )
    op.add_column(
        "card_levels",
        sa.Column("answer_image_url", sa.String(), nullable=True),
    )

    # Migrate arrays back to single values (take first element if exists)
    op.execute("""
        UPDATE card_levels
        SET question_image_url = CASE WHEN question_image_urls IS NOT NULL
            AND array_length(question_image_urls, 1) > 0
            THEN question_image_urls[1] ELSE NULL END,
            answer_image_url = CASE WHEN answer_image_urls IS NOT NULL
            AND array_length(answer_image_urls, 1) > 0
            THEN answer_image_urls[1] ELSE NULL END,
            question_audio_url = CASE WHEN question_audio_urls IS NOT NULL
            AND array_length(question_audio_urls, 1) > 0
            THEN question_audio_urls[1] ELSE NULL END,
            answer_audio_url = CASE WHEN answer_audio_urls IS NOT NULL
            AND array_length(answer_audio_urls, 1) > 0
            THEN answer_audio_urls[1] ELSE NULL END
    """)

    # Drop array columns
    op.drop_column("card_levels", "answer_audio_urls")
    op.drop_column("card_levels", "question_audio_urls")
    op.drop_column("card_levels", "answer_image_urls")
    op.drop_column("card_levels", "question_image_urls")
