import React from 'react'
import type { DifficultyDistribution } from '@/entities/statistics'
import { DonutChart } from '@/shared/ui/kit/DonutChart'
import type { DonutChartData } from '@/shared/ui/kit/DonutChart'

import styles from './CardDifficultyDonut.module.css'

type Props = {
  distribution: DifficultyDistribution
  onCenterClick?: () => void
}

// Difficulty category colors
const COLORS = {
  easy: '#22c55e', // green
  medium: '#f59e0b', // amber
  hard: '#ef4444', // red
} as const

const handleSectorClick = (sector: string) => {
  // Sectors will be clickable in the future, for now do nothing
  console.log(`Clicked on sector: ${sector}`)
}

export function CardDifficultyDonut({ distribution, onCenterClick }: Props) {
  // Don't render if no cards
  if (distribution.totalCount === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.chartSection}>
          <div className={styles.chartWrapper}>
            <DonutChart
              data={[{ name: 'Пусто', value: 1, fill: '#e5e7eb' }]}
              innerRadius="80%"
              outerRadius="92%"
            />
            <div className={styles.centerLabel} onClick={onCenterClick}>
              <div className={styles.centerValue}>0</div>
              <div className={styles.centerLabelText}>Карточек</div>
            </div>
          </div>
        </div>
        <div className={styles.legendSection}>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ backgroundColor: COLORS.easy }} />
            <span className={styles.legendText}>Легко: 0</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ backgroundColor: COLORS.medium }} />
            <span className={styles.legendText}>Средне: 0</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ backgroundColor: COLORS.hard }} />
            <span className={styles.legendText}>Сложно: 0</span>
          </div>
        </div>
      </div>
    )
  }

  const data: DonutChartData[] = [
    { name: 'Легко', value: distribution.easyCount, fill: COLORS.easy },
    { name: 'Средне', value: distribution.mediumCount, fill: COLORS.medium },
    { name: 'Сложно', value: distribution.hardCount, fill: COLORS.hard },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.chartSection}>
        <div className={styles.chartWrapper}>
          <DonutChart
            data={data}
            innerRadius="80%"
            outerRadius="92%"
            onSectorClick={handleSectorClick}
          />
          <div className={styles.centerLabel} onClick={onCenterClick}>
            <div className={styles.centerValue}>{distribution.totalCount}</div>
            <div className={styles.centerLabelText}>
              {distribution.totalCount === 1
                ? 'Карточка'
                : distribution.totalCount >= 2 && distribution.totalCount <= 4
                  ? 'Карточки'
                  : 'Карточек'}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.legendSection}>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: COLORS.easy }} />
          <span className={styles.legendText}>Легко: {distribution.easyCount}</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: COLORS.medium }} />
          <span className={styles.legendText}>Средне: {distribution.mediumCount}</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: COLORS.hard }} />
          <span className={styles.legendText}>Сложно: {distribution.hardCount}</span>
        </div>
      </div>
    </div>
  )
}
