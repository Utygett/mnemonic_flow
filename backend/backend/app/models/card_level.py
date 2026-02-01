from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.card import Card  # noqa: F401 - needed for SQLAlchemy relationship


class CardLevel(Base):
    __tablename__ = "card_levels"

    __table_args__ = (UniqueConstraint("card_id", "level_index", name="uq_card_level_index"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    card_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    level_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Level-specific images
    question_image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    question_image_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    answer_image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    answer_image_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Level-specific audio
    question_audio_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    question_audio_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    answer_audio_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    answer_audio_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    card: Mapped[Card] = relationship("Card", back_populates="levels")  # noqa: F821

    progress: Mapped[list[CardProgress]] = relationship(  # noqa: F821
        "CardProgress",
        back_populates="card_level",
        cascade="all, delete-orphan",
    )

    review_history: Mapped[list[CardReviewHistory]] = relationship(  # noqa: F821
        "CardReviewHistory",
        back_populates="card_level",
        cascade="all, delete-orphan",
    )
