import type { DifficultyRating } from '@/entities/card'

export const MOCK_RATING_INTERVAL_SECONDS: Record<DifficultyRating, number> = {
  again: 60, // 1 мин
  hard: 10 * 60, // 10 мин
  good: 24 * 60 * 60, // 1 день
  easy: 4 * 24 * 60 * 60, // 4 дня
}
