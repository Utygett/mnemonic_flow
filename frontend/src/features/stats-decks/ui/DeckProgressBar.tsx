import styles from './DeckProgressBar.module.css'

interface DeckProgressBarProps {
  mastered: number
  learning: number
  newCards: number
  total: number
}

export function DeckProgressBar({ mastered, learning, newCards, total }: DeckProgressBarProps) {
  if (total === 0) return null

  const masteredPercent = (mastered / total) * 100
  const learningPercent = (learning / total) * 100
  const newPercent = (newCards / total) * 100

  return (
    <div className={styles.progressBar}>
      <div
        className={styles.progressSegment}
        style={{
          width: `${masteredPercent}%`,
          backgroundColor: 'var(--success, #38a169)',
        }}
        title={`Выучено: ${mastered}`}
      />
      <div
        className={styles.progressSegment}
        style={{
          width: `${learningPercent}%`,
          backgroundColor: 'var(--warning, #d69e2e)',
        }}
        title={`Изучается: ${learning}`}
      />
      <div
        className={styles.progressSegment}
        style={{
          width: `${newPercent}%`,
          backgroundColor: 'var(--border)',
        }}
        title={`Новых: ${newCards}`}
      />
    </div>
  )
}
