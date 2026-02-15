from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import ReviewRating


class CardForReview(BaseModel):
    card_id: UUID
    deck_id: UUID
    title: str
    type: str

    card_level_id: UUID
    level_index: int
    content: dict

    stability: float
    difficulty: float

    next_review: Optional[datetime]
    question_image_urls: Optional[List[str]] = None
    answer_image_urls: Optional[List[str]] = None
    question_audio_urls: Optional[List[str]] = None
    answer_audio_urls: Optional[List[str]] = None


class ReviewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    rating: ReviewRating
    shown_at: datetime = Field(..., alias="shownAt")
    revealed_at: Optional[datetime] = Field(None, alias="revealedAt")
    rated_at: datetime = Field(..., alias="ratedAt")
    timezone: Optional[str] = None


class ReviewResponse(BaseModel):
    card_id: UUID

    card_level_id: UUID
    level_index: int

    stability: float
    difficulty: float
    next_review: datetime


class ReviewPreviewItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    rating: ReviewRating
    interval_seconds: int = Field(..., alias="intervalSeconds")
    next_review: datetime = Field(..., alias="nextReview")
