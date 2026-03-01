// Statistics domain types

export interface DifficultyDistribution {
  easyCount: number
  mediumCount: number
  hardCount: number
  totalCount: number
}

export interface Statistics {
  cardsStudiedToday: number
  timeSpentToday: number // minutes
  currentStreak: number // days
  totalCards: number
  weeklyActivity: number[] // 7 days
  achievements: Achievement[]
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  progress?: number
}

// New types for enhanced statistics

export interface RatingDistribution {
  again: number
  hard: number
  good: number
  easy: number
  percentages: {
    again: number
    hard: number
    good: number
    easy: number
  }
}

export interface GeneralStatistics {
  totalStudyTimeMinutes: number
  totalStudyTimeFormatted: string // e.g. "12h 35m" or "2 days 4h"
  averageSessionDurationMinutes: number
  totalReviews: number
  learningSpeedCardsPerDay: number
  ratingDistribution: RatingDistribution
  averageRating: number // 1.0-4.0
}

export interface ActivityHeatmapEntry {
  date: string // YYYY-MM-DD
  reviewsCount: number
  studyTimeMinutes: number
}

export interface DeckProgressStats {
  deckId: string
  deckTitle: string
  deckColor: string
  totalCards: number
  masteredCards: number // stability >= 30 days
  learningCards: number // 0 < stability < 30 days
  newCards: number // never reviewed
  progressPercentage: number // 0-100
  totalReviews: number
  totalStudyTimeMinutes: number
}

export interface ActivityChartEntry {
  date: string
  reviews: number
  newCards: number
  studyTimeMinutes: number
  uniqueCards: number
}

export type ChartPeriod = 'day' | 'week' | 'month'
