# backend/app/schemas/comment.py
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_serializer


class CreateCommentRequest(BaseModel):
    """Request schema for creating a comment."""

    content: str = Field(..., min_length=1, max_length=5000, description="Comment content")


class CommentResponse(BaseModel):
    """Response schema for a comment with author information."""

    id: UUID = Field(..., description="Comment ID")
    content: str = Field(..., description="Comment content")
    created_at: datetime = Field(..., description="Comment creation timestamp")
    author_username: str = Field(..., description="Username of the comment author")

    model_config = {"from_attributes": True}

    @field_serializer("id")
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    @field_serializer("created_at")
    def serialize_created_at(self, value: datetime) -> str:
        return value.isoformat()
