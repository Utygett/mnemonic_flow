import type { ActivityHeatmapEntry } from '@/entities/statistics/model/types'

export interface HeatmapCell {
  date: string
  reviewsCount: number
  studyTimeMinutes: number
  level: 0 | 1 | 2 | 3 // activity level for coloring
}

const ACTIVITY_THRESHOLDS = [
  { max: 0, level: 0 }, // no activity
  { max: 3, level: 1 }, // low
  { max: 10, level: 2 }, // medium
  { max: Infinity, level: 3 }, // high
]

export function generateHeatmapGrid(
  data: ActivityHeatmapEntry[],
  weeks: number = 12
): HeatmapCell[][] {
  // Group by week starting from Sunday
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - weeks * 7)

  // Create date lookup map
  const dataMap = new Map<string, ActivityHeatmapEntry>()
  data.forEach(entry => {
    dataMap.set(entry.date, entry)
  })

  // Generate grid
  const grid: HeatmapCell[][] = []
  const currentDate = new Date(startDate)

  // Align to Sunday
  const dayOfWeek = currentDate.getDay()
  currentDate.setDate(currentDate.getDate() - dayOfWeek)

  for (let week = 0; week < weeks; week++) {
    const weekData: HeatmapCell[] = []

    for (let day = 0; day < 7; day++) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const entry = dataMap.get(dateStr)

      const reviewsCount = entry?.reviewsCount || 0
      const studyTimeMinutes = entry?.studyTimeMinutes || 0
      const level = getActivityLevel(reviewsCount)

      weekData.push({
        date: dateStr,
        reviewsCount,
        studyTimeMinutes,
        level,
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    grid.push(weekData)
  }

  return grid
}

export function getActivityLevel(count: number): 0 | 1 | 2 | 3 {
  for (const threshold of ACTIVITY_THRESHOLDS) {
    if (count <= threshold.max) {
      return threshold.level as 0 | 1 | 2 | 3
    }
  }
  return 0
}

export function getCellColor(level: 0 | 1 | 2 | 3): string {
  // Using CSS variables for theme support
  const colors = {
    0: 'var(--bg-secondary)', // no activity - gray
    1: 'color-mix(in srgb, var(--primary) 25%, transparent)', // low - light
    2: 'color-mix(in srgb, var(--primary) 50%, transparent)', // medium - medium
    3: 'var(--primary)', // high - full color
  }
  return colors[level]
}

export function formatHeatmapDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function getDayLabel(dayIndex: number): string {
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  return days[dayIndex]
}
