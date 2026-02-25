# backend/app/api/routes/comments.py
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user_id
from app.db.session import SessionLocal
from app.models.card_level import CardLevel
from app.models.comment import Comment
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
) -> list[dict]:
    """
    Get all comments for a specific card level.

    Comments are visible to all users (no authentication required).
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

    # Get comments with author usernames
    comments = (
        db.query(Comment, User)
        .join(User, Comment.user_id == User.id)
        .filter(Comment.card_level_id == level_id)
        .order_by(Comment.created_at.asc())
        .all()
    )

    result = [
        {
            "id": str(comment.id),
            "content": comment.content,
            "created_at": comment.created_at.replace(tzinfo=None).isoformat() + "Z",
            "author_username": user.username,
        }
        for comment, user in comments
    ]

    return result


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

    # Create comment
    comment = Comment(
        user_id=user_id,
        card_id=card_id,
        card_level_id=level_id,
        content=payload.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return {
        "id": str(comment.id),
        "content": comment.content,
        "created_at": comment.created_at.replace(tzinfo=None).isoformat() + "Z",
        "author_username": user.username,
    }
