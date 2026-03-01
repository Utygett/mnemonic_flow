import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getActivityHeatmap } from '@/entities/statistics/api/statisticsApi'
import { generateHeatmapGrid, getCellColor, getDayLabel } from '../lib/heatmapUtils'
import styles from './ActivityHeatmap.module.css'

interface ActivityHeatmapProps {
  days?: number
}

export function ActivityHeatmap({ days = 365 }: ActivityHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['stats', 'heatmap', days],
    queryFn: () => getActivityHeatmap(days),
  })

  if (isLoading) {
    return <div className="loading">Загрузка тепловой карты...</div>
  }

  if (!data || data.length === 0) {
    return (
      <section className="statsSection">
        <h2 className="statsSection__title">Активность</h2>
        <div className="text-muted">Нет данных об активности</div>
      </section>
    )
  }

  // Calculate weeks from days (approximately)
  const weeks = Math.min(Math.ceil(days / 7), 52) // Max 52 weeks (1 year)
  const grid = generateHeatmapGrid(data, weeks)

  const hoveredData = hoveredCell ? data.find(d => d.date === hoveredCell) : null

  return (
    <section className="statsSection">
      <h2 className="statsSection__title">Тепловая карта активности</h2>

      <div className={styles.heatmapContainer}>
        {/* Day labels */}
        <div className={styles.dayLabels}>
          {[0, 2, 4, 6].map(dayIndex => (
            <div key={dayIndex} className={styles.dayLabel}>
              {getDayLabel(dayIndex)}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className={styles.grid}>
          {grid.map((week, weekIndex) => (
            <div key={weekIndex} className={styles.weekColumn}>
              {week.map(cell => (
                <div
                  key={cell.date}
                  className={styles.cell}
                  style={{ backgroundColor: getCellColor(cell.level) }}
                  onMouseEnter={() => setHoveredCell(cell.date)}
                  onMouseLeave={() => setHoveredCell(null)}
                  title={`${cell.date}: ${cell.reviewsCount} ревью`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className="text-muted">Меньше</span>
        {[0, 1, 2, 3].map(level => (
          <div
            key={level}
            className={styles.legendCell}
            style={{ backgroundColor: getCellColor(level as 0 | 1 | 2 | 3) }}
          />
        ))}
        <span className="text-muted">Больше</span>
      </div>

      {/* Tooltip */}
      {hoveredData && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipDate}>
            {new Date(hoveredData.date).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <div className={styles.tooltipStat}>{hoveredData.reviewsCount} ревью</div>
          <div className={styles.tooltipStat}>{hoveredData.studyTimeMinutes} минут</div>
        </div>
      )}
    </section>
  )
}
