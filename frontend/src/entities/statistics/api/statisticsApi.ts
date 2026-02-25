// Statistics API methods
import { apiRequest } from '@/shared/api/request'
import type { DifficultyDistribution, Statistics } from '../model/types'

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
