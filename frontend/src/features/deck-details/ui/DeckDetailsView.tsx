import React from 'react'

import type { StudyMode } from '@/entities/card'
import type { PersistedSession } from '@/shared/lib/utils/session-store'
import { Button } from '@/shared/ui/Button/Button'

import styles from './DeckDetailsView.module.css'

type Props = {
  deckId: string
  limit: number
  setLimit: (v: number) => void

  saved: PersistedSession | null
  hasSaved: boolean

  limitClamped: number

  onBack: () => void
  onResume: () => void
  onStart: (mode: StudyMode) => void
}

export function DeckDetailsView(props: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <Button onClick={props.onBack} variant="secondary" size="small">
            Назад
          </Button>
          <h1 className={styles.title}>Колода</h1>
          <div className={styles.meta}>id: {props.deckId}</div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.stack}>
          {props.hasSaved && props.saved && (
            <div className={styles.card}>
              <p className={styles.cardTitle}>Есть незавершённая сессия</p>
              <p className={styles.cardMeta}>
                Карточка {(props.saved.currentIndex ?? 0) + 1} из {props.saved.deckCards.length}
              </p>

              <div className={styles.inlineActions}>
                <Button onClick={props.onResume} variant="primary" size="medium">
                  Продолжить
                </Button>
              </div>
            </div>
          )}

          <Button onClick={() => props.onStart('random')} variant="primary" size="large" fullWidth>
            Случайно
          </Button>

          <Button
            onClick={() => props.onStart('ordered')}
            variant="secondary"
            size="large"
            fullWidth
          >
            По порядку
          </Button>

          <Button
            onClick={() => props.onStart('new_random')}
            variant="secondary"
            size="large"
            fullWidth
          >
            Новые случайно
          </Button>

          <Button
            onClick={() => props.onStart('new_ordered')}
            variant="secondary"
            size="large"
            fullWidth
          >
            Новые по порядку
          </Button>

          <div className={styles.card}>
            <div className={styles.sectionLabel}>Кол-во карточек для “Новые …”</div>

            <input
              className={styles.input}
              type="number"
              min={1}
              max={200}
              value={String(props.limit)}
              onChange={e => props.setLimit(Number(e.target.value))}
              placeholder="Напр. 20"
            />

            <div className={styles.hint}>Будет использовано: {props.limitClamped}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
