// Statistics API methods
import { apiRequest } from '@/shared/api/request'
import type {
  ActivityChartEntry,
  ActivityHeatmapEntry,
  ChartPeriod,
  DeckProgressStats,
  DifficultyDistribution,
  GeneralStatistics,
  Statistics,
} from '../model/types'

// Dashboard statistics from backend
export async function getStatistics(): Promise<Statistics> {
  const dashboardStats = await apiRequest<{
    cards_studied_today: number
    time_spent_today: number
    current_streak: number
    total_cards: number
  }>('/stats/dashboard')

  return {
    cardsStudiedToday: dashboardStats.cards_studied_today,
    timeSpentToday: dashboardStats.time_spent_today,
    currentStreak: dashboardStats.current_streak,
    totalCards: dashboardStats.total_cards,
    weeklyActivity: [], // TODO: implement when backend provides this data
    achievements: [], // TODO: implement when backend provides this data
  }
}

// Difficulty distribution for donut chart
export async function getDifficultyDistribution(): Promise<DifficultyDistribution> {
  const response = await apiRequest<{
    easy_count: number
    medium_count: number
    hard_count: number
    total_count: number
  }>('/stats/difficulty-distribution')

  return {
    easyCount: response.easy_count,
    mediumCount: response.medium_count,
    hardCount: response.hard_count,
    totalCount: response.total_count,
  }
}

// General lifetime statistics
export async function getGeneralStatistics(): Promise<GeneralStatistics> {
  const response = await apiRequest<{
    total_study_time_minutes: number
    total_study_time_formatted: string
    average_session_duration_minutes: number
    total_reviews: number
    learning_speed_cards_per_day: number
    rating_distribution: {
      again_count: number
      hard_count: number
      good_count: number
      easy_count: number
      total_count: number
      again_percentage: number
      hard_percentage: number
      good_percentage: number
      easy_percentage: number
    }
    average_rating: number
  }>('/stats/general')

  return {
    totalStudyTimeMinutes: response.total_study_time_minutes,
    totalStudyTimeFormatted: response.total_study_time_formatted,
    averageSessionDurationMinutes: response.average_session_duration_minutes,
    totalReviews: response.total_reviews,
    learningSpeedCardsPerDay: response.learning_speed_cards_per_day,
    ratingDistribution: {
      again: response.rating_distribution.again_count,
      hard: response.rating_distribution.hard_count,
      good: response.rating_distribution.good_count,
      easy: response.rating_distribution.easy_count,
      percentages: {
        again: response.rating_distribution.again_percentage,
        hard: response.rating_distribution.hard_percentage,
        good: response.rating_distribution.good_percentage,
        easy: response.rating_distribution.easy_percentage,
      },
    },
    averageRating: response.average_rating,
  }
}

// Activity heatmap data
export async function getActivityHeatmap(days: number = 365): Promise<ActivityHeatmapEntry[]> {
  const response = await apiRequest<{
    entries: Array<{
      date: string
      reviews_count: number
      study_time_minutes: number
    }>
  }>(`/stats/activity-heatmap?days=${days}`)

  return response.entries.map(entry => ({
    date: entry.date,
    reviewsCount: entry.reviews_count,
    studyTimeMinutes: entry.study_time_minutes,
  }))
}

// Deck progress statistics
export async function getDeckProgress(): Promise<DeckProgressStats[]> {
  const response = await apiRequest<{
    decks: Array<{
      deck_id: string
      deck_title: string
      deck_color: string
      total_cards: number
      mastered_cards: number
      learning_cards: number
      new_cards: number
      progress_percentage: number
      total_reviews: number
      total_study_time_minutes: number
    }>
  }>('/stats/deck-progress')

  return response.decks.map(deck => ({
    deckId: deck.deck_id,
    deckTitle: deck.deck_title,
    deckColor: deck.deck_color,
    totalCards: deck.total_cards,
    masteredCards: deck.mastered_cards,
    learningCards: deck.learning_cards,
    newCards: deck.new_cards,
    progressPercentage: deck.progress_percentage,
    totalReviews: deck.total_reviews,
    totalStudyTimeMinutes: deck.total_study_time_minutes,
  }))
}

// Activity chart data
export async function getActivityChart(
  period: ChartPeriod,
  days: number = 30
): Promise<ActivityChartEntry[]> {
  const response = await apiRequest<{
    period: string
    data: Array<{
      date: string
      reviews: number
      new_cards: number
      study_time_minutes: number
      unique_cards: number
    }>
  }>(`/stats/activity-chart?period=${period}&days=${days}`)

  return response.data.map(entry => ({
    date: entry.date,
    reviews: entry.reviews,
    newCards: entry.new_cards,
    studyTimeMinutes: entry.study_time_minutes,
    uniqueCards: entry.unique_cards,
  }))
}
