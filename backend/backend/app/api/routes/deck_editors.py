"""Endpoints for managing deck editor invites and editor list."""

import base64
import io
import secrets
from datetime import datetime, timezone
from typing import List, Literal, Optional
from uuid import UUID

import qrcode
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user_id
from app.db.session import SessionLocal
from app.models.deck import Deck
from app.models.deck_editor import DeckEditor
from app.models.deck_invite_token import DeckInviteToken
from app.models.user import User
from app.models.user_study_group import UserStudyGroup
from app.models.user_study_group_deck import UserStudyGroupDeck
from app.services.deck_access import is_deck_owner

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


class InviteCreateRequest(BaseModel):
    invite_type: Literal["editor", "viewer"] = "editor"


class InviteCreateResponse(BaseModel):
    token: str
    invite_url: str
    qr_base64: str
    invite_type: str
    expires_at: Optional[datetime]


class EditorInfo(BaseModel):
    user_id: UUID
    email: Optional[str]
    username: Optional[str]
    invited_by: UUID
    created_at: datetime


class JoinResponse(BaseModel):
    detail: str
    deck_id: str
    deck_title: str
    invite_type: str  # 'editor' | 'viewer'
    group_title: Optional[str] = None  # filled for viewer/editor invites


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

FRONTEND_BASE_URL = "https://mnemonicflow.ru"


def _generate_qr_base64(url: str) -> str:
    """Generate QR code image for url, return as base64-encoded PNG string."""
    qr = qrcode.QRCode(box_size=8, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode()


def _pick_best_user_group(db: Session, user_id: UUID) -> Optional[UserStudyGroup]:
    """Return user's group titled 'Мои колоды' (case-insensitive), else the first one."""
    from app.models.study_group import StudyGroup

    rows = (
        db.query(UserStudyGroup, StudyGroup)
        .outerjoin(StudyGroup, UserStudyGroup.source_group_id == StudyGroup.id)
        .filter(UserStudyGroup.user_id == user_id)
        .all()
    )
    if not rows:
        return None

    for ug, sg in rows:
        title = ug.title_override or (sg.title if sg else "") or "Мои колоды"
        if title.strip().lower() == "мои колоды":
            return ug
    return rows[0][0]


def _get_group_title(db: Session, ug: UserStudyGroup) -> str:
    """Resolve display title for a UserStudyGroup."""
    from app.models.study_group import StudyGroup

    if ug.title_override:
        return ug.title_override
    if ug.source_group_id:
        sg = db.query(StudyGroup).filter(StudyGroup.id == ug.source_group_id).first()
        if sg:
            return sg.title
    return "Мои колоды"


def _add_deck_to_user_group(db: Session, ug: UserStudyGroup, deck_id: UUID) -> None:
    """Add deck to user group, idempotent."""
    existing = (
        db.query(UserStudyGroupDeck)
        .filter(
            UserStudyGroupDeck.user_group_id == ug.id,
            UserStudyGroupDeck.deck_id == deck_id,
        )
        .first()
    )
    if existing:
        return

    max_order = (
        db.query(func.max(UserStudyGroupDeck.order_index))
        .filter(UserStudyGroupDeck.user_group_id == ug.id)
        .scalar()
    )
    next_order = (max_order + 1) if max_order is not None else 0
    db.add(UserStudyGroupDeck(user_group_id=ug.id, deck_id=deck_id, order_index=next_order))
    db.commit()


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
    body: InviteCreateRequest = InviteCreateRequest(),
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Generate an invite link + QR code.
    invite_type='editor'  — recipient becomes an editor and deck is added to their group.
    invite_type='viewer'  — recipient can add the deck to their own group (read-only).
    Only the deck owner can create invites.
    """
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if not is_deck_owner(db, deck_id, user_id):
        raise HTTPException(status_code=403, detail="Only the deck owner can create invites")

    token_str = secrets.token_urlsafe(32)
    invite = DeckInviteToken(
        deck_id=deck_id,
        created_by=user_id,
        token=token_str,
        invite_type=body.invite_type,
        expires_at=None,
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
        invite_type=body.invite_type,
        expires_at=invite.expires_at,
    )


@router.post("/join/{token}", response_model=JoinResponse, status_code=status.HTTP_200_OK)
def join_by_token(
    token: str,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Activate an invite token.
    - viewer: adds deck to the user's best group ('Мои колоды' or first).
    - editor: adds deck to group AND grants editor rights.
    """
    invite = (
        db.query(DeckInviteToken)
        .filter(DeckInviteToken.token == token, DeckInviteToken.is_active.is_(True))
        .first()
    )
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found or already deactivated")

    if invite.expires_at and invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Invite has expired")

    deck_id = invite.deck_id
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    invite_type = getattr(invite, "invite_type", "editor") or "editor"

    # --- viewer flow: add deck to user's group (read-only access) ---
    if invite_type == "viewer":
        ug = _pick_best_user_group(db, user_id)
        if not ug:
            raise HTTPException(
                status_code=400,
                detail="You have no groups. Create at least one group first.",
            )
        _add_deck_to_user_group(db, ug, deck_id)
        group_title = _get_group_title(db, ug)
        return JoinResponse(
            detail="Deck added to group",
            deck_id=str(deck_id),
            deck_title=deck.title,
            invite_type="viewer",
            group_title=group_title,
        )

    # --- editor flow ---
    if deck.owner_id == user_id:
        raise HTTPException(status_code=400, detail="You are already the owner of this deck")

    # Add deck to editor's group (same as viewer, so it appears in the list)
    ug = _pick_best_user_group(db, user_id)
    if not ug:
        raise HTTPException(
            status_code=400,
            detail="You have no groups. Create at least one group first.",
        )
    _add_deck_to_user_group(db, ug, deck_id)
    group_title = _get_group_title(db, ug)

    # Grant editor rights (idempotent)
    existing = (
        db.query(DeckEditor)
        .filter(DeckEditor.deck_id == deck_id, DeckEditor.user_id == user_id)
        .first()
    )
    if existing:
        return JoinResponse(
            detail="Already an editor",
            deck_id=str(deck_id),
            deck_title=deck.title,
            invite_type="editor",
            group_title=group_title,
        )

    editor = DeckEditor(
        deck_id=deck_id,
        user_id=user_id,
        invited_by=invite.created_by,
    )
    db.add(editor)
    db.commit()

    return JoinResponse(
        detail="Editor access granted",
        deck_id=str(deck_id),
        deck_title=deck.title,
        invite_type="editor",
        group_title=group_title,
    )


@router.get("/{deck_id}/editors", response_model=List[EditorInfo])
def list_editors(
    deck_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """List all editors of a deck. Only accessible by the deck owner."""
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if not is_deck_owner(db, deck_id, user_id):
        raise HTTPException(status_code=403, detail="Only the deck owner can view editors")

    editors = db.query(DeckEditor).filter(DeckEditor.deck_id == deck_id).all()
    result = []
    for e in editors:
        u = db.query(User).filter(User.id == e.user_id).first()
        result.append(
            EditorInfo(
                user_id=e.user_id,
                email=u.email if u else None,
                username=getattr(u, "username", None) if u else None,
                invited_by=e.invited_by,
                created_at=e.created_at,
            )
        )
    return result


@router.delete("/{deck_id}/editors/{editor_user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_editor(
    deck_id: UUID,
    editor_user_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Remove an editor from a deck. Only the owner can do this."""
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if not is_deck_owner(db, deck_id, user_id):
        raise HTTPException(status_code=403, detail="Only the deck owner can remove editors")

    editor = (
        db.query(DeckEditor)
        .filter(DeckEditor.deck_id == deck_id, DeckEditor.user_id == editor_user_id)
        .first()
    )
    if not editor:
        raise HTTPException(status_code=404, detail="Editor not found")

    db.delete(editor)
    db.commit()
    return


@router.delete("/{deck_id}/invite/{token}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_invite(
    deck_id: UUID,
    token: str,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Deactivate an invite token so it can no longer be used."""
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if not is_deck_owner(db, deck_id, user_id):
        raise HTTPException(status_code=403, detail="Only the deck owner can revoke invites")

    invite = (
        db.query(DeckInviteToken)
        .filter(DeckInviteToken.deck_id == deck_id, DeckInviteToken.token == token)
        .first()
    )
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    invite.is_active = False
    db.commit()
    return
