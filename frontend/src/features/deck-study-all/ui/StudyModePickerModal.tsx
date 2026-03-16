import React, { useState } from 'react'
import { Minus, Plus, X } from 'lucide-react'

import type { StudyMode } from '@/entities/card'
import type { PublicDeckSummary } from '@/entities/deck'
import { Button } from '@/shared/ui/Button/Button'

import styles from './StudyModePickerModal.module.css'

type Props = {
  deck: PublicDeckSummary
  onStudyStart: (deckId: string, mode: StudyMode) => void
  onClose: () => void
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

export function StudyModePickerModal({ deck, onStudyStart, onClose }: Props) {
  const [selectedMode, setSelectedMode] = useState<StudyMode>('ordered')
  const [limit, setLimit] = useState(20)

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  React.useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleStart = () => {
    onStudyStart(deck.deck_id, selectedMode)
  }

  const decrementLimit = () => {
    setLimit(Math.max(1, limit - 5))
  }

  const incrementLimit = () => {
    setLimit(Math.min(200, limit + 5))
  }

  const limitClamped = Math.max(
    1,
    Math.min(200, Math.trunc(Number.isFinite(Number(limit)) ? Number(limit) : 20))
  )

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>{deck.title}</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>Выберите режим изучения</p>

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
                  disabled={limit <= 1}
                  aria-label="Уменьшить"
                >
                  <Minus size={16} strokeWidth={2.5} />
                </button>
                <span className={styles.stepperValue}>{limitClamped}</span>
                <button
                  type="button"
                  className={styles.stepperBtn}
                  onClick={incrementLimit}
                  disabled={limit >= 200}
                  aria-label="Увеличить"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )}

          <button type="button" className={styles.startBtn} onClick={handleStart}>
            Начать изучение
          </button>
        </div>
      </div>
    </div>
  )
}
