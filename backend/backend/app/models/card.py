import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

from .card_card_tag import CardCardTag
from .card_tag import CardTag  # noqa: F401 - needed for SQLAlchemy relationship


class Card(Base):
    __tablename__ = "cards"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    deck_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("decks.id"),
    )

    type: Mapped[str] = mapped_column(String)
    title: Mapped[str] = mapped_column(String)

    max_level: Mapped[int] = mapped_column(Integer)
    settings: Mapped[dict | None] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    progress = relationship(
        "CardProgress",
        back_populates="card",
        cascade="all, delete-orphan",
    )

    review_history = relationship(
        "CardReviewHistory",
        back_populates="card",
        cascade="all, delete-orphan",
    )

    tags = relationship(
        "CardTag",
        secondary=CardCardTag,
        back_populates="cards",
    )

    levels = relationship(
        "CardLevel",
        back_populates="card",
        cascade="all, delete-orphan",
    )
