from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, conint, model_validator


class CardLevelContent(BaseModel):
    level_index: int
    content: Dict
    question_image_url: Optional[str] = None
    answer_image_url: Optional[str] = None


class CardForReviewWithLevels(BaseModel):
    card_id: UUID
    deck_id: UUID
    title: str
    type: str

    card_level_id: UUID
    level_index: int
    content: dict

    stability: float
    difficulty: float
    next_review: datetime

    levels: List[CardLevelContent]


class CardSummary(BaseModel):
    card_id: UUID
    title: str
    type: str
    levels: Optional[List[CardLevelContent]] = []


class CardLevelPayload(BaseModel):
    question: str
    answer: str


class CreateCardLevelOption(BaseModel):
    id: str
    text: str
    image_url: Optional[str] = None


class CreateCardLevelRequest(BaseModel):
    question: str

    # flashcard
    answer: Optional[str] = None

    # multiple_choice
    options: Optional[List[CreateCardLevelOption]] = None
    correctOptionId: Optional[str] = None
    explanation: Optional[str] = None
    timerSec: Optional[conint(ge=1, le=3600)] = None


class CreateCardRequest(BaseModel):
    deck_id: str
    title: str
    type: str  # или Literal["flashcard","multiple_choice"], если уже готов
    levels: List[CreateCardLevelRequest]


class QaContentIn(BaseModel):
    question: str
    answer: str


class McqOptionIn(BaseModel):
    id: str
    text: str
    image_url: Optional[str] = None


class McqContentIn(BaseModel):
    question: str
    options: List[McqOptionIn]
    correctOptionId: str
    explanation: str = ""
    timerSec: conint(ge=0) = 0


ContentIn = Union[QaContentIn, McqContentIn]


class LevelIn(BaseModel):
    level_index: int = Field(ge=0)
    content: ContentIn

    @model_validator(mode="before")
    @classmethod
    def parse_content_union(cls, data: Any) -> Any:
        """
        Payload приходит как:
        {
          "level_index": 0,
          "content": { ... }
        }

        Так как в content нет discriminator-поля (kind/type),
        определяем тип по наличию ключей options/correctOptionId. [web:2]
        """
        if isinstance(data, dict):
            c = data.get("content") or {}

            if isinstance(c, dict) and ("options" in c or "correctOptionId" in c):
                data["content"] = McqContentIn(**c)
            else:
                data["content"] = QaContentIn(**c)

        return data


class ReplaceLevelsRequest(BaseModel):
    levels: List[LevelIn]


class DeckSummary(BaseModel):
    deck_id: UUID
    title: str
    description: str | None = None


class DeckSessionCard(BaseModel):
    card_id: UUID
    deck_id: UUID
    title: str
    type: str

    active_card_level_id: UUID
    active_level_index: int

    levels: List[CardLevelContent]
    question_image_url: Optional[str] = None
    answer_image_url: Optional[str] = None


class DeckCreate(BaseModel):
    title: str
    description: str | None = None
    color: str | None = None


class CreateCardResponse(BaseModel):
    card_id: UUID
    deck_id: UUID


class DeckUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = Field(default=None, min_length=1)  # опционально: regex под HEX
    is_public: Optional[bool] = None


class DeckDetail(BaseModel):
    deck_id: UUID = Field(validation_alias="id", serialization_alias="deck_id")
    title: str
    description: Optional[str] = None
    color: str
    owner_id: UUID
    is_public: bool

    count_repeat: int = 0
    count_for_repeat: int = 0
    cards_count: int = 0
    completed_cards_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class DeckWithCards(BaseModel):
    deck: DeckDetail
    cards: List[CardSummary]
