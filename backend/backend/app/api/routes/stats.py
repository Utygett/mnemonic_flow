# backend/app/api/routes/stats.py
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import Integer, func
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user_id
from app.db.session import SessionLocal
from app.models.card import Card
from app.models.card_progress import CardProgress
from app.models.card_review_history import CardReviewHistory
from app.schemas.stats import DashboardStatsResponse, DifficultyDistributionResponse

router = APIRouter()


def get_db():
    """Dependency for database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_today_start() -> datetime:
    """Get start of current day in UTC"""
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def calculate_streak(db: Session, user_id: UUID) -> int:
    """
    Calculate current streak of consecutive days with reviews.
    Streak is counted from today backwards until a day with no reviews is found.
    """
    # Get all dates with reviews for this user
    review_dates = (
        db.query(func.date(CardReviewHistory.reviewed_at))
        .filter(CardReviewHistory.user_id == user_id)
        .distinct()
        .order_by(func.date(CardReviewHistory.reviewed_at).desc())
        .all()
    )

    if not review_dates:
        return 0

    # Convert to set of date objects for easier lookup
    dates_set = {row[0] for row in review_dates}

    # Get today's date in UTC
    today = datetime.now(timezone.utc).date()
    yesterday = today - timedelta(days=1)

    streak = 0

    # Check if there's activity today or yesterday to start counting
    if today in dates_set:
        # Activity today - start counting from today
        check_date = today
    elif yesterday in dates_set:
        # No activity today but was active yesterday - start counting from yesterday
        check_date = yesterday
    else:
        # No activity today or yesterday - streak is broken
        return 0

    # Count consecutive days backwards
    while check_date in dates_set:
        streak += 1
        check_date -= timedelta(days=1)

    return streak


@router.get("/dashboard", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> DashboardStatsResponse:
    """
    Get statistics for the dashboard.

    Returns:
        - cards_studied_today: Number of cards reviewed today
        - time_spent_today: Total time spent studying today (in minutes)
        - current_streak: Current streak of consecutive study days
        - total_cards: Total number of cards owned by the user
    """
    today_start = get_today_start()

    # 1. Cards studied today - count CardProgress with last_reviewed >= today_start
    cards_studied_today = (
        db.query(func.count(CardProgress.id))
        .filter(
            CardProgress.user_id == user_id,
            CardProgress.last_reviewed >= today_start,
        )
        .scalar()
    )

    # 2. Time spent today - sum of time between show_at and reviewed_at (in minutes)
    # This counts total time with the card (from showing to rating), not just answer viewing
    time_result = (
        db.query(
            func.sum(
                func.extract("epoch", CardReviewHistory.reviewed_at - CardReviewHistory.show_at)
                / 60
            )
        )
        .filter(
            CardReviewHistory.user_id == user_id,
            CardReviewHistory.reviewed_at >= today_start,
        )
        .scalar()
    )
    time_spent_today = int(time_result) if time_result is not None else 0

    # 3. Current streak - calculate consecutive days with reviews
    current_streak = calculate_streak(db, user_id)

    # 4. Total cards - count all cards belonging to user's decks
    total_cards = (
        db.query(func.count(Card.id))
        .join(Card.progress)
        .filter(CardProgress.user_id == user_id)
        .scalar()
    )

    return DashboardStatsResponse(
        cards_studied_today=cards_studied_today or 0,
        time_spent_today=time_spent_today,
        current_streak=current_streak,
        total_cards=total_cards or 0,
    )


@router.get("/difficulty-distribution", response_model=DifficultyDistributionResponse)
def get_difficulty_distribution(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> DifficultyDistributionResponse:
    """
    Get distribution of cards by difficulty categories.

    Difficulty ranges:
        - easy: 1-3 (green)
        - medium: 4-6 (amber/yellow)
        - hard: 7-10 (red)

    Returns:
        - easy_count: Number of cards with difficulty 1-3
        - medium_count: Number of cards with difficulty 4-6
        - hard_count: Number of cards with difficulty 7-10
        - total_count: Total number of cards
    """
    # Count cards by difficulty ranges using CASE aggregation
    result = (
        db.query(
            func.sum(func.cast(CardProgress.difficulty < 4, Integer)).label("easy_count"),
            func.sum(
                func.cast((CardProgress.difficulty >= 4) & (CardProgress.difficulty < 7), Integer)
            ).label("medium_count"),
            func.sum(func.cast(CardProgress.difficulty >= 7, Integer)).label("hard_count"),
            func.count(CardProgress.id).label("total_count"),
        )
        .filter(CardProgress.user_id == user_id)
        .one()
    )

    easy_count = int(result.easy_count) if result.easy_count is not None else 0
    medium_count = int(result.medium_count) if result.medium_count is not None else 0
    hard_count = int(result.hard_count) if result.hard_count is not None else 0
    total_count = int(result.total_count) if result.total_count is not None else 0

    return DifficultyDistributionResponse(
        easy_count=easy_count,
        medium_count=medium_count,
        hard_count=hard_count,
        total_count=total_count,
    )
