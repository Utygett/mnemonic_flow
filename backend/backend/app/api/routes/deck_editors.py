"""Endpoints for managing deck editor invites and editor list."""

import base64
import io
import secrets
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

import qrcode
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user_id
from app.db.session import SessionLocal
from app.models.deck_editor import DeckEditor
from app.models.deck_invite_token import DeckInviteToken
from app.models.user import User
from app.services.deck_access import is_deck_owner, require_deck_editor

router = APIRouter(tags=["deck-editors"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class InviteCreateResponse(BaseModel):
    token: str
    invite_url: str
    qr_base64: str
    expires_at: Optional[datetime]


class EditorInfo(BaseModel):
    user_id: UUID
    email: Optional[str]
    username: Optional[str]
    invited_by: UUID
    created_at: datetime


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

FRONTEND_BASE_URL = "https://mnemonicflow.app"  # TODO: move to settings


def _generate_qr_base64(url: str) -> str:
    """Generate QR code image for url, return as base64-encoded PNG string."""
    qr = qrcode.QRCode(box_size=8, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post(
    "/{deck_id}/invite",
    response_model=InviteCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_invite(
    deck_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Generate an invite link + QR code that grants editor access to this deck.
    Only the deck owner can create invites.
    """
    if not is_deck_owner(db, deck_id, user_id):
        raise HTTPException(status_code=403, detail="Only the deck owner can create invites")

    token_str = secrets.token_urlsafe(32)
    invite = DeckInviteToken(
        deck_id=deck_id,
        created_by=user_id,
        token=token_str,
        expires_at=None,  # бессрочный — можно добавить TTL позже
        is_active=True,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    invite_url = f"{FRONTEND_BASE_URL}/join/{token_str}"
    qr_b64 = _generate_qr_base64(invite_url)

    return InviteCreateResponse(
        token=token_str,
        invite_url=invite_url,
        qr_base64=qr_b64,
        expires_at=invite.expires_at,
    )


@router.post("/join/{token}", status_code=status.HTTP_200_OK)
def join_by_token(
    token: str,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Activate an invite token — adds the current user as a deck editor."""
    invite = (
        db.query(DeckInviteToken)
        .filter(DeckInviteToken.token == token, DeckInviteToken.is_active.is_(True))
        .first()
    )
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found or already used")

    # Проверяем срок действия
    if invite.expires_at and invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Invite has expired")

    deck_id = invite.deck_id

    # Нельзя стать редактором своей же колоды
    from app.models.deck import Deck  # local import to avoid circular

    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if deck.owner_id == user_id:
        raise HTTPException(status_code=400, detail="You are already the owner of this deck")

    # Идемпотентность: уже редактор — просто возвращаем OK
    existing = (
        db.query(DeckEditor)
        .filter(DeckEditor.deck_id == deck_id, DeckEditor.user_id == user_id)
        .first()
    )
    if existing:
        return {"detail": "Already an editor", "deck_id": str(deck_id)}

    editor = DeckEditor(
        deck_id=deck_id,
        user_id=user_id,
        invited_by=invite.created_by,
    )
    db.add(editor)
    db.commit()

    return {"detail": "Editor access granted", "deck_id": str(deck_id)}
