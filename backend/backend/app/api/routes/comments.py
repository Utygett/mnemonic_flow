# backend/app/api/routes/comments.py
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user_id
from app.db.session import SessionLocal
from app.models.card import Card
from app.models.card_level import CardLevel
from app.models.comment import Comment
from app.models.deck import Deck
from app.models.user import User
from app.schemas.comment import CreateCommentRequest

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get(
    "/cards/{card_id}/levels/{level_id}/comments",
    status_code=status.HTTP_200_OK,
)
def get_comments(
    card_id: UUID,
    level_id: UUID,
    db: Session = Depends(get_db),
) -> Any:
    """
    Get all comments for a specific card level.

    Comments are visible to all users (no authentication required).
    Newest comments appear first.
    """
    # Verify card level exists
    card_level = (
        db.query(CardLevel).filter(CardLevel.id == level_id, CardLevel.card_id == card_id).first()
    )
    if not card_level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card level not found",
        )

    # Get comments with author usernames, newest first
    # Use id as secondary sort to ensure consistent ordering when timestamps are equal
    comments = (
        db.query(Comment, User)
        .join(User, Comment.user_id == User.id)
        .filter(Comment.card_level_id == level_id)
        .order_by(Comment.created_at.desc(), Comment.id.desc())
        .all()
    )

    result = [
        {
            "id": str(comment.id),
            "content": comment.content,
            "created_at": (
                comment.created_at.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
            ),
            "author_username": user.username,
            "user_id": str(comment.user_id),
        }
        for comment, user in comments
    ]

    return JSONResponse(
        content=result,
        headers={"Cache-Control": "no-store, no-cache, must-revalidate", "Pragma": "no-cache"},
    )


@router.post(
    "/cards/{card_id}/levels/{level_id}/comments",
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    card_id: UUID,
    level_id: UUID,
    payload: CreateCommentRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    """
    Create a new comment on a card level.

    Requires authentication.
    """
    # Verify card level exists
    card_level = (
        db.query(CardLevel).filter(CardLevel.id == level_id, CardLevel.card_id == card_id).first()
    )
    if not card_level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card level not found",
        )

    # Get user for username
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Create comment with explicit timestamp
    comment = Comment(
        user_id=user_id,
        card_id=card_id,
        card_level_id=level_id,
        content=payload.content,
        created_at=datetime.now(timezone.utc),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return {
        "id": str(comment.id),
        "content": comment.content,
        "created_at": (
            comment.created_at.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        ),
        "author_username": user.username,
        "user_id": str(comment.user_id),
    }


@router.delete(
    "/cards/{card_id}/levels/{level_id}/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_comment(
    card_id: UUID,
    level_id: UUID,
    comment_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Delete a comment. The author of the comment or the deck owner can delete it.

    Requires authentication.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    # Get the card to find the deck
    card = db.query(Card).filter(Card.id == comment.card_id).first()
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found",
        )

    # Get the deck to check ownership
    deck = db.query(Deck).filter(Deck.id == card.deck_id).first()
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found",
        )

    # Allow deletion if user is the comment author or the deck owner
    is_author = comment.user_id == user_id
    is_deck_owner = deck.owner_id == user_id

    if not is_author and not is_deck_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own comments or comments on cards in your decks",
        )

    db.delete(comment)
    db.commit()
    return
