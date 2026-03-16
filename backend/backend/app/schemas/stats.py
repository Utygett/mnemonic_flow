# backend/app/schemas/stats.py
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DifficultyDistributionResponse(BaseModel):
    """Распределение карточек по категориям сложности"""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "easy_count": 45,
                "medium_count": 30,
                "hard_count": 15,
                "total_count": 90,
            }
        }
    )

    easy_count: int  # Карточки с difficulty 1-3
    medium_count: int  # Карточки с difficulty 4-6
    hard_count: int  # Карточки с difficulty 7-10
    total_count: int  # Общее количество карточек


class DashboardStatsResponse(BaseModel):
    """Статистика для дашборда"""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "cards_studied_today": 15,
                "time_spent_today": 25,
                "current_streak": 7,
                "total_cards": 120,
            }
        }
    )

    cards_studied_today: int  # Количество карточек изучено сегодня
    time_spent_today: int  # Время потрачено сегодня (в минутах)
    current_streak: int  # Текущая серия дней (стрик)
    total_cards: int  # Общее количество карточек пользователя


class RatingDistributionResponse(BaseModel):
    """Распределение оценок по всем ревью"""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "again_count": 10,
                "hard_count": 25,
                "good_count": 50,
                "easy_count": 15,
                "total_count": 100,
                "again_percentage": 10.0,
                "hard_percentage": 25.0,
                "good_percentage": 50.0,
                "easy_percentage": 15.0,
            }
        }
    )

    again_count: int
    hard_count: int
    good_count: int
    easy_count: int
    total_count: int
    again_percentage: float
    hard_percentage: float
    good_percentage: float
    easy_percentage: float


class GeneralStatsResponse(BaseModel):
    """Общая статистика обучения"""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_study_time_minutes": 1500,
                "total_study_time_formatted": "25h 0m",
                "average_session_duration_minutes": 25.5,
                "total_reviews": 250,
                "learning_speed_cards_per_day": 3.5,
                "rating_distribution": {
                    "again_count": 10,
                    "hard_count": 25,
                    "good_count": 50,
                    "easy_count": 15,
                    "total_count": 100,
                    "again_percentage": 10.0,
                    "hard_percentage": 25.0,
                    "good_percentage": 50.0,
                    "easy_percentage": 15.0,
                },
                "average_rating": 2.7,
            }
        }
    )

    total_study_time_minutes: int
    total_study_time_formatted: str  # "25h 35m" or "2 days 4h"
    average_session_duration_minutes: float
    total_reviews: int
    learning_speed_cards_per_day: float
    rating_distribution: RatingDistributionResponse
    average_rating: float  # 1.0-4.0 scale


class ActivityHeatmapEntry(BaseModel):
    """Одна запись для тепловой карты активности"""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "date": "2025-01-15",
                "reviews_count": 25,
                "study_time_minutes": 45,
            }
        }
    )

    date: str  # YYYY-MM-DD
    reviews_count: int
    study_time_minutes: int


class ActivityHeatmapResponse(BaseModel):
    """Данные для тепловой карты активности"""

    entries: list[ActivityHeatmapEntry]


class DeckProgressStats(BaseModel):
    """Статистика прогресса по одной колоде"""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "deck_id": "123e4567-e89b-12d3-a456-426614174000",
                "deck_title": "Spanish Vocabulary",
                "deck_color": "#4A6FA5",
                "total_cards": 100,
                "mastered_cards": 45,
                "learning_cards": 35,
                "new_cards": 20,
                "progress_percentage": 45.0,
                "total_reviews": 250,
                "total_study_time_minutes": 500,
            }
        }
    )

    deck_id: UUID
    deck_title: str
    deck_color: str
    total_cards: int
    mastered_cards: int  # stability >= 30 days
    learning_cards: int  # 0 < stability < 30 days
    new_cards: int  # never reviewed
    progress_percentage: float  # 0-100
    total_reviews: int
    total_study_time_minutes: int


class DeckProgressResponse(BaseModel):
    """Статистика прогресса по всем колодам"""

    decks: list[DeckProgressStats]


class ActivityChartEntry(BaseModel):
    """Одна запись для графика активности"""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "date": "2025-01-15",
                "reviews": 25,
                "new_cards": 5,
                "study_time_minutes": 45,
                "unique_cards": 20,
            }
        }
    )

    date: str
    reviews: int
    new_cards: int
    study_time_minutes: int
    unique_cards: int


class ActivityChartResponse(BaseModel):
    """Данные для графика активности"""

    period: str  # 'day', 'week', or 'month'
    data: list[ActivityChartEntry]
