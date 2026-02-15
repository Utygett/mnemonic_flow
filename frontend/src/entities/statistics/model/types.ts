// Statistics domain types

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
