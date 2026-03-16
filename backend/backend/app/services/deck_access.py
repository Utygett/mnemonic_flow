"""Helpers for checking deck edit/ownership permissions."""

from uuid import UUID

from sqlalchemy.orm import Session

from app.models.deck import Deck
from app.models.deck_editor import DeckEditor


def is_deck_editor(db: Session, deck_id: UUID, user_id: UUID) -> bool:
    """Return True if user_id is the owner of deck_id or an invited editor."""
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        return False
    if deck.owner_id == user_id:
        return True
    editor = (
        db.query(DeckEditor)
        .filter(DeckEditor.deck_id == deck_id, DeckEditor.user_id == user_id)
        .first()
    )
    return editor is not None


def require_deck_editor(db: Session, deck_id: UUID, user_id: UUID) -> Deck:
    """Return Deck if user has editor access, raise ValueError otherwise.

    Callers should translate ValueError to HTTPException 403.
    """
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise ValueError("not_found")
    if deck.owner_id == user_id:
        return deck
    editor = (
        db.query(DeckEditor)
        .filter(DeckEditor.deck_id == deck_id, DeckEditor.user_id == user_id)
        .first()
    )
    if not editor:
        raise ValueError("forbidden")
    return deck


def is_deck_owner(db: Session, deck_id: UUID, user_id: UUID) -> bool:
    """Return True only if user_id is the owner (not just an editor)."""
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        return False
    return deck.owner_id == user_id
