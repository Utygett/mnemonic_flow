# backend/app/schemas/stats.py
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
