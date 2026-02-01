from typing import Dict
from uuid import UUID

from pydantic import BaseModel


class CardLevelContent(BaseModel):
    front: str
    back: str
    contact: str  # контакт на уровне карточки


class CardWithLevels(BaseModel):
    card_id: UUID
    title: str
    type: str
    levels: Dict[str, CardLevelContent]  # ключ — уровень, значение — контент уровня
