# app/schemas/decks_public.py
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PublicDeckSummary(BaseModel):
    deck_id: UUID
    title: str
    description: Optional[str] = None
    color: Optional[str] = None
    owner_id: UUID

    model_config = ConfigDict(from_attributes=True)
