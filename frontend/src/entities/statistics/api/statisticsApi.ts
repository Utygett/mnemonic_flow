// Statistics API methods
import type { Statistics } from '../model/types';

// Mock implementation (replace with real API when ready)
export async function getStatistics(): Promise<Statistics> {
  return {
    cardsStudiedToday: 6,
    timeSpentToday: 15,
    currentStreak: 4,
    totalCards: 20,
    weeklyActivity: [2, 4, 3, 5, 1, 0, 50],
    achievements: [
      {
        id: 'first',
        title: 'Первый успех',
        description: 'Первое достижение',
        icon: '⭐',
        unlocked: true,
      },
      {
        id: 'ten',
        title: '10 карточек',
        description: 'Изучено 10 карточек',
        icon: '🔟',
        unlocked: true,
      },
    ],
  };
}
