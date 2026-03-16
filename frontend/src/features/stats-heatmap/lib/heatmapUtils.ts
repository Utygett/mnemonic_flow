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
  // Create date lookup map
  const dataMap = new Map<string, ActivityHeatmapEntry>()
  data.forEach(entry => {
    dataMap.set(entry.date, entry)
  })

  // Start from today and work backwards
  const now = new Date()
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  // Find the most recent Sunday on or before today
  const endOfWeek = new Date(todayUTC)
  const daysSinceSunday = todayUTC.getUTCDay() // 0 = Sunday, 1 = Monday, etc.
  endOfWeek.setUTCDate(endOfWeek.getUTCDate() - daysSinceSunday)

  // Calculate start date (weeks * 7 days before the Sunday)
  const startDate = new Date(endOfWeek)
  startDate.setUTCDate(startDate.getUTCDate() - (weeks - 1) * 7)

  // Generate grid from start to end
  const grid: HeatmapCell[][] = []
  const currentDate = new Date(startDate)

  for (let week = 0; week < weeks; week++) {
    const weekData: HeatmapCell[] = []

    for (let day = 0; day < 7; day++) {
      // Format date as YYYY-MM-DD using UTC components
      const year = currentDate.getUTCFullYear()
      const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0')
      const dayOfMonth = String(currentDate.getUTCDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${dayOfMonth}`
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

      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }

    grid.push(weekData)
  }

  return grid
}

function formatDateUTC(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
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
