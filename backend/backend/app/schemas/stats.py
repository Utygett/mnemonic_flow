# backend/app/schemas/stats.py
from pydantic import BaseModel


class DashboardStatsResponse(BaseModel):
    """Статистика для дашборда"""

    cards_studied_today: int  # Количество карточек изучено сегодня
    time_spent_today: int  # Время потрачено сегодня (в минутах)
    current_streak: int  # Текущая серия дней (стрик)
    total_cards: int  # Общее количество карточек пользователя

    class Config:
        json_schema_extra = {
            "example": {
                "cards_studied_today": 15,
                "time_spent_today": 25,
                "current_streak": 7,
                "total_cards": 120,
            }
        }
