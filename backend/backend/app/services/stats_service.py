# backend/app/services/stats_service.py
"""
Statistics service for aggregating and calculating user learning analytics.

Provides functions for:
- General statistics (total time, average session, learning speed, ratings)
- Activity heatmap data
- Deck progress statistics
- Activity chart data
"""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import case, func, text
from sqlalchemy.orm import Session

from app.models.card import Card
from app.models.card_progress import CardProgress
from app.models.card_review_history import CardReviewHistory
from app.models.deck import Deck


def format_duration(total_minutes: int) -> str:
    """
    Format duration in minutes to human-readable string.

    Args:
        total_minutes: Total duration in minutes

    Returns:
        Formatted string like "2h 35m" or "3 days 4h"
    """
    if total_minutes < 60:
        return f"{total_minutes}m"

    hours = total_minutes // 60
    minutes = total_minutes % 60

    if hours < 24:
        return f"{hours}h {minutes}m"

    days = hours // 24
    remaining_hours = hours % 24

    if remaining_hours == 0:
        return f"{days} day{'s' if days > 1 else ''}"
    return f"{days} day{'s' if days > 1 else ''} {remaining_hours}h"


def get_user_study_dates(db: Session, user_id: UUID) -> set[datetime.date]:
    """
    Get all dates when user had review activity.

    Args:
        db: Database session
        user_id: User UUID

    Returns:
        Set of dates with reviews
    """
    result = (
        db.query(func.date(CardReviewHistory.reviewed_at))
        .filter(CardReviewHistory.user_id == user_id)
        .distinct()
        .all()
    )
    return {row[0] for row in result}


def calculate_rating_distribution(db: Session, user_id: UUID) -> dict[str, int]:
    """
    Calculate distribution of ratings across all reviews.

    Args:
        db: Database session
        user_id: User UUID

    Returns:
        Dict with counts for each rating: again, hard, good, easy
    """
    result = (
        db.query(
            CardReviewHistory.rating,
            func.count(CardReviewHistory.id).label("count"),
        )
        .filter(CardReviewHistory.user_id == user_id)
        .group_by(CardReviewHistory.rating)
        .all()
    )

    distribution = {"again": 0, "hard": 0, "good": 0, "easy": 0}
    for rating, count in result:
        distribution[rating] = count

    return distribution


def calculate_average_rating(db: Session, user_id: UUID) -> float:
    """
    Calculate average rating on 1-4 scale.

    Rating mapping: again=1, hard=2, good=3, easy=4

    Args:
        db: Database session
        user_id: User UUID

    Returns:
        Average rating (1.0-4.0)
    """
    avg = (
        db.query(
            func.avg(
                case(
                    (CardReviewHistory.rating == "again", 1),
                    (CardReviewHistory.rating == "hard", 2),
                    (CardReviewHistory.rating == "good", 3),
                    (CardReviewHistory.rating == "easy", 4),
                    else_=2,
                )
            )
        )
        .filter(CardReviewHistory.user_id == user_id)
        .scalar()
    )
    return float(avg) if avg is not None else 0.0


def calculate_total_study_time(db: Session, user_id: UUID) -> int:
    """
    Calculate total study time in minutes.

    Args:
        db: Database session
        user_id: User UUID

    Returns:
        Total study time in minutes
    """
    result = (
        db.query(
            func.sum(
                func.extract("epoch", CardReviewHistory.reviewed_at - CardReviewHistory.show_at)
                / 60
            )
        )
        .filter(CardReviewHistory.user_id == user_id)
        .scalar()
    )
    return int(result) if result is not None else 0


def calculate_average_session_duration(db: Session, user_id: UUID) -> float:
    """
    Calculate average session duration in minutes.

    Session = all reviews in a single calendar day.

    Args:
        db: Database session
        user_id: User UUID

    Returns:
        Average session duration in minutes
    """
    # Get daily study times
    daily_times = (
        db.query(
            func.date(CardReviewHistory.reviewed_at).label("review_date"),
            func.sum(
                func.extract("epoch", CardReviewHistory.reviewed_at - CardReviewHistory.show_at)
                / 60
            ).label("daily_minutes"),
        )
        .filter(CardReviewHistory.user_id == user_id)
        .group_by(func.date(CardReviewHistory.reviewed_at))
        .all()
    )

    if not daily_times:
        return 0.0

    total_minutes = sum(row.daily_minutes for row in daily_times)
    return round(total_minutes / len(daily_times), 2)


def calculate_learning_speed(db: Session, user_id: UUID) -> float:
    """
    Calculate average new cards created per day.

    Args:
        db: Database session
        user_id: User UUID

    Returns:
        Average new cards per day
    """
    # Get first and last card creation dates
    date_range = (
        db.query(
            func.min(Card.created_at).label("first_card"),
            func.max(Card.created_at).label("last_card"),
        )
        .join(Card.progress)
        .filter(CardProgress.user_id == user_id)
        .one()
    )

    if date_range.first_card is None:
        return 0.0

    first_card = date_range.first_card
    last_card = date_range.last_card or datetime.now(timezone.utc)

    # Calculate days span
    days_span = (last_card - first_card).days
    if days_span < 1:
        days_span = 1

    # Count total cards
    total_cards = (
        db.query(func.count(Card.id))
        .join(Card.progress)
        .filter(CardProgress.user_id == user_id)
        .scalar()
    )

    return round(total_cards / days_span, 2)


def get_activity_heatmap(db: Session, user_id: UUID, days: int = 365) -> list[dict]:
    """
    Get activity data for GitHub-style heatmap.

    Args:
        db: Database session
        user_id: User UUID
        days: Number of days to include (default 365)

    Returns:
        List of dicts with date, reviews_count, study_time_minutes
    """
    end_date = datetime.now(timezone.utc).date()
    start_date = end_date - timedelta(days=days - 1)

    # Build SQL query with string interpolation for dates
    # (can't use bind params with generate_series casting)
    start_date_str = start_date.isoformat()
    end_date_str = end_date.isoformat()
    user_id_str = str(user_id)

    query = text(f"""
        SELECT
            d.date::text as date,
            COALESCE(COUNT(crh.id), 0) as reviews_count,
            COALESCE(
                SUM(EXTRACT(EPOCH FROM (crh.reviewed_at - crh.show_at)) / 60),
                0
            ) as study_time_minutes
        FROM generate_series(
            '{start_date_str}'::date,
            '{end_date_str}'::date,
            INTERVAL '1 day'
        ) d(date)
        LEFT JOIN card_review_history crh ON
            crh.user_id = '{user_id_str}' AND
            DATE(crh.reviewed_at) = d.date
        GROUP BY d.date
        ORDER BY d.date
    """)

    result = db.execute(query)

    return [
        {
            "date": row.date,
            "reviews_count": row.reviews_count,
            "study_time_minutes": int(row.study_time_minutes),
        }
        for row in result
    ]


def get_deck_progress(db: Session, user_id: UUID) -> list[dict]:
    """
    Get progress statistics for each deck.

    Mastery threshold: stability >= 30 days

    Args:
        db: Database session
        user_id: User UUID

    Returns:
        List of deck progress statistics
    """
    result = (
        db.query(
            Deck.id.label("deck_id"),
            Deck.title.label("deck_title"),
            Deck.color.label("deck_color"),
            func.count(Card.id).label("total_cards"),
            func.sum(
                case(
                    (CardProgress.stability >= 30, 1),
                    else_=0,
                )
            ).label("mastered_cards"),
            func.sum(
                case(
                    (CardProgress.stability > 0, 1),
                    else_=0,
                )
            ).label("learning_cards_raw"),
            func.sum(
                case(
                    (CardProgress.last_reviewed.is_(None), 1),
                    else_=0,
                )
            ).label("new_cards"),
            func.coalesce(
                func.sum(
                    case(
                        (CardProgress.stability >= 30, 0),
                        (CardProgress.stability > 0, 1),
                        else_=0,
                    )
                ),
                0,
            ).label("learning_cards"),
        )
        .join(Card, Card.deck_id == Deck.id)
        .outerjoin(
            CardProgress, (CardProgress.card_id == Card.id) & (CardProgress.user_id == user_id)
        )
        .filter(Deck.owner_id == user_id)
        .group_by(Deck.id, Deck.title, Deck.color)
        .all()
    )

    decks = []
    for row in result:
        total_cards = row.total_cards or 0
        mastered = row.mastered_cards or 0
        learning = row.learning_cards or 0
        new_cards = row.new_cards or 0

        # Calculate progress percentage
        if total_cards > 0:
            progress_percentage = round((mastered / total_cards) * 100, 1)
        else:
            progress_percentage = 0.0

        # Get total reviews and study time for this deck
        deck_stats = (
            db.query(
                func.count(CardReviewHistory.id).label("total_reviews"),
                func.sum(
                    func.extract("epoch", CardReviewHistory.reviewed_at - CardReviewHistory.show_at)
                    / 60
                ).label("total_study_time"),
            )
            .join(Card, Card.id == CardReviewHistory.card_id)
            .filter(Card.deck_id == row.deck_id, CardReviewHistory.user_id == user_id)
            .one()
        )

        decks.append(
            {
                "deck_id": str(row.deck_id),
                "deck_title": row.deck_title,
                "deck_color": row.deck_color,
                "total_cards": total_cards,
                "mastered_cards": mastered,
                "learning_cards": learning,
                "new_cards": new_cards,
                "progress_percentage": progress_percentage,
                "total_reviews": deck_stats.total_reviews or 0,
                "total_study_time_minutes": int(deck_stats.total_study_time or 0),
            }
        )

    # Sort by total reviews (most active first)
    decks.sort(key=lambda x: x["total_reviews"], reverse=True)
    return decks


def get_activity_chart(
    db: Session, user_id: UUID, period: str = "day", days: int = 30
) -> list[dict]:
    """
    Get activity chart data for line/bar charts.

    Args:
        db: Database session
        user_id: User UUID
        period: Time bucket - 'day', 'week', or 'month'
        days: Number of days to include

    Returns:
        List of time-bucketed activity data
    """
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)

    # Determine truncation based on period
    if period == "week":
        date_trunc = func.date_trunc("week", CardReviewHistory.reviewed_at)
    elif period == "month":
        date_trunc = func.date_trunc("month", CardReviewHistory.reviewed_at)
    else:  # day
        date_trunc = func.date_trunc("day", CardReviewHistory.reviewed_at)

    result = (
        db.query(
            date_trunc.label("bucket"),
            func.count(CardReviewHistory.id).label("reviews"),
            func.count(
                func.distinct(
                    case(
                        (Card.created_at >= start_date, CardReviewHistory.card_id),
                    )
                )
            ).label("new_cards"),
            func.sum(
                func.extract("epoch", CardReviewHistory.reviewed_at - CardReviewHistory.show_at)
                / 60
            ).label("study_time_minutes"),
            func.count(func.distinct(CardReviewHistory.card_id)).label("unique_cards"),
        )
        .join(Card, Card.id == CardReviewHistory.card_id)
        .filter(
            CardReviewHistory.user_id == user_id,
            CardReviewHistory.reviewed_at >= start_date,
        )
        .group_by(date_trunc)
        .order_by(date_trunc)
        .all()
    )

    return [
        {
            "date": str(row.bucket.date()),
            "reviews": row.reviews,
            "new_cards": row.new_cards,
            "study_time_minutes": int(row.study_time_minutes or 0),
            "unique_cards": row.unique_cards,
        }
        for row in result
    ]
