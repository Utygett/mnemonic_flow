// Statistics API methods
import { apiRequest } from '@/shared/api/request';
import type { Statistics } from '../model/types';

// Dashboard statistics from backend
export async function getStatistics(): Promise<Statistics> {
  const dashboardStats = await apiRequest<{
    cards_studied_today: number;
    time_spent_today: number;
    current_streak: number;
    total_cards: number;
  }>('/stats/dashboard');

  return {
    cardsStudiedToday: dashboardStats.cards_studied_today,
    timeSpentToday: dashboardStats.time_spent_today,
    currentStreak: dashboardStats.current_streak,
    totalCards: dashboardStats.total_cards,
    weeklyActivity: [], // TODO: implement when backend provides this data
    achievements: [], // TODO: implement when backend provides this data
  };
}
