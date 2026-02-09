import React, { useState } from 'react'
import { Minus, Plus } from 'lucide-react'

import type { StudyMode } from '@/entities/card'
import type { PersistedSession } from '@/shared/lib/utils/session-store'
import { Button } from '@/shared/ui/Button/Button'

import styles from './StudyModeSelector.module.css'

type Props = {
  saved: PersistedSession | null
  hasSaved: boolean
  limit: number
  setLimit: (v: number) => void
  limitClamped: number
  onResume: () => void
  onStart: (mode: StudyMode) => void
}

const MODES: { value: StudyMode; label: string }[] = [
  { value: 'ordered', label: 'По порядку' },
  { value: 'random', label: 'Случайно' },
  { value: 'new_ordered', label: 'Новые по пор.' },
  { value: 'new_random', label: 'Новые случ.' },
]

function isNewMode(mode: StudyMode): boolean {
  return mode === 'new_random' || mode === 'new_ordered'
}

export function StudyModeSelector(props: Props) {
  const [selectedMode, setSelectedMode] = useState<StudyMode>('ordered')

  const handleStart = () => {
    props.onStart(selectedMode)
  }

  const decrementLimit = () => {
    props.setLimit(Math.max(1, props.limit - 5))
  }

  const incrementLimit = () => {
    props.setLimit(Math.min(200, props.limit + 5))
  }

  return (
    <div className={styles.wrapper}>
      {props.hasSaved && props.saved && (
        <div className={styles.resumeCard}>
          <p className={styles.resumeTitle}>Есть незавершённая сессия</p>
          <p className={styles.resumeMeta}>
            Карточка {(props.saved.currentIndex ?? 0) + 1} из {props.saved.deckCards.length}
          </p>
          <div className={styles.resumeActions}>
            <Button onClick={props.onResume} variant="primary" size="medium">
              Продолжить
            </Button>
          </div>
        </div>
      )}

      <div className={styles.panel}>
        <div className={styles.chipsGrid}>
          {MODES.map(mode => (
            <button
              key={mode.value}
              type="button"
              className={
                selectedMode === mode.value ? `${styles.chip} ${styles.chipActive}` : styles.chip
              }
              onClick={() => setSelectedMode(mode.value)}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {isNewMode(selectedMode) && (
          <div className={styles.stepperRow}>
            <span className={styles.stepperLabel}>Карточек:</span>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.stepperBtn}
                onClick={decrementLimit}
                disabled={props.limit <= 1}
                aria-label="Уменьшить"
              >
                <Minus size={16} strokeWidth={2.5} />
              </button>
              <span className={styles.stepperValue}>{props.limitClamped}</span>
              <button
                type="button"
                className={styles.stepperBtn}
                onClick={incrementLimit}
                disabled={props.limit >= 200}
                aria-label="Увеличить"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        <button type="button" className={styles.startBtn} onClick={handleStart}>
          Начать обучение
        </button>
      </div>
    </div>
  )
}
