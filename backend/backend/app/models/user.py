from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# These imports are needed for SQLAlchemy relationship initialization
from app.models.card_progress import CardProgress  # noqa: F401
from app.models.card_review_history import CardReviewHistory  # noqa: F401
from app.models.user_learning_settings import UserLearningSettings  # noqa: F401


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)
    username: Mapped[str] = mapped_column(String)

    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_verification_token: Mapped[str | None] = mapped_column(String, nullable=True)
    email_verification_expires: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Password reset
    password_reset_token: Mapped[str | None] = mapped_column(String, nullable=True)
    password_reset_expires: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    card_progress: Mapped[list[CardProgress]] = relationship(
        "CardProgress", back_populates="user", cascade="all, delete-orphan"
    )  # noqa: F821

    learning_settings: Mapped[UserLearningSettings] = relationship(
        "UserLearningSettings", back_populates="user", uselist=False
    )  # noqa: F821

    review_history: Mapped[list[CardReviewHistory]] = relationship(
        "CardReviewHistory", back_populates="user", cascade="all, delete-orphan"
    )  # noqa: F821

    comments: Mapped[list["Comment"]] = relationship(  # noqa: F821
        "Comment", back_populates="user", cascade="all, delete-orphan"
    )
