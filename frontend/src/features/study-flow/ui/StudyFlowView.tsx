import React from 'react'

import type { CardReviewInput, StudyCard } from '@/entities/card'
import type { SessionStats } from '../model/StudyFlowStateContainer'
import { StudySession } from '../session/StudySession'

import styles from './StudyFlow.module.css'

type Props = {
  isStudying: boolean
  loadingDeckCards: boolean
  deckCards: StudyCard[]

  cards: StudyCard[]
  currentIndex: number
  isCompleted: boolean

  onRate: (review: CardReviewInput) => void
  onLevelUp: () => void
  onLevelDown: () => void
  onSkip: () => void
  onRemoveFromProgress: () => void
  onClose: () => void

  onBackToHome: () => void
  sessionStats?: SessionStats
}

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const MAX_CARD_VIEW_MS = 60_000

export function StudyFlowView(props: Props) {
  if (!props.isStudying) return null

  if (props.loadingDeckCards) {
    return (
      <div className={styles.studyFlow}>
        <div className={styles.studyFlowCenter}>
          <div className={styles.studyFlowMuted}>Загрузка карточек…</div>
        </div>
      </div>
    )
  }

  if (props.deckCards.length === 0) {
    return (
      <div className={styles.studyFlow}>
        <div className={`${styles.studyFlowCenter} ${styles.studyFlowCenterPadded}`}>
          <div className={`${styles.studyFlowCard} ${styles.studyFlowCardNarrow}`}>
            <h2 className={styles.studyFlowTitle}>Нет карточек</h2>
            <p className={styles.studyFlowText}>В этой сессии нет карточек для изучения.</p>
            <button
              className={`btn-primary ${styles.studyFlowFullWidth}`}
              onClick={props.onBackToHome}
            >
              Вернуться
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (props.isCompleted) {
    const stats = props.sessionStats
    const startedAtMs = stats?.startedAtMs ?? 0
    const finishedAtMs = stats?.finishedAtMs ?? Date.now()

    const ratedCount = stats?.ratedCount ?? 0

    const rawDurationMs =
      startedAtMs > 0 ? Math.max(0, finishedAtMs - startedAtMs) : 0

    // Cap "time spent" to 1 minute per rated card to avoid huge numbers
    // when the user leaves the session in background.
    const durationMs =
      ratedCount > 0 ? Math.min(rawDurationMs, ratedCount * MAX_CARD_VIEW_MS) : 0

    const avgMs = ratedCount > 0 ? Math.round(durationMs / ratedCount) : 0
    const counts = stats?.ratingCounts

    return (
      <div className={styles.studyFlow}>
        <div className={`${styles.studyFlowCenter} ${styles.studyFlowCenterPadded}`}>
          <div className={`${styles.studyFlowCard} ${styles.studyFlowCardNarrow}`}>
            <div className={styles.studyFlowEmoji} aria-hidden="true">
              🎉
            </div>
            <h2 className={styles.studyFlowTitle}>Сессия завершена</h2>
            <p className={styles.studyFlowText}>Отличная работа! Ты прошёл все карточки.</p>

            <div className={styles.sessionStats}>
              <div className={styles.sessionStatsRow}>
                <span className={styles.sessionStatsLabel}>⏱️ Время сессии</span>
                <span className={styles.sessionStatsValue}>{formatDuration(durationMs)}</span>
              </div>
              <div className={styles.sessionStatsRow}>
                <span className={styles.sessionStatsLabel}>📚 Карточек</span>
                <span className={styles.sessionStatsValue}>{ratedCount}</span>
              </div>
              <div className={styles.sessionStatsRow}>
                <span className={styles.sessionStatsLabel}>⚡ Среднее время</span>
                <span className={styles.sessionStatsValue}>{formatDuration(avgMs)}</span>
              </div>
            </div>

            <div className={styles.ratingStats}>
              <div className={styles.ratingStatsItem}>
                <span className={styles.ratingDot} style={{ background: '#ef4444' }} />
                <span className={styles.ratingLabel}>Снова</span>
                <span className={styles.ratingValue}>{counts?.again ?? 0}</span>
              </div>
              <div className={styles.ratingStatsItem}>
                <span className={styles.ratingDot} style={{ background: '#f97316' }} />
                <span className={styles.ratingLabel}>Трудно</span>
                <span className={styles.ratingValue}>{counts?.hard ?? 0}</span>
              </div>
              <div className={styles.ratingStatsItem}>
                <span className={styles.ratingDot} style={{ background: '#22c55e' }} />
                <span className={styles.ratingLabel}>Хорошо</span>
                <span className={styles.ratingValue}>{counts?.good ?? 0}</span>
              </div>
              <div className={styles.ratingStatsItem}>
                <span className={styles.ratingDot} style={{ background: '#3b82f6' }} />
                <span className={styles.ratingLabel}>Легко</span>
                <span className={styles.ratingValue}>{counts?.easy ?? 0}</span>
              </div>
            </div>

            <button
              className={`btn-primary ${styles.studyFlowFullWidth}`}
              onClick={props.onBackToHome}
            >
              Вернуться в меню
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (props.cards.length === 0) {
    return (
      <div className={styles.studyFlow}>
        <div className={styles.studyFlowCenter}>
          <div className={styles.studyFlowMuted}>Нет карточек для изучения</div>
        </div>
      </div>
    )
  }

  return (
    <StudySession
      cards={props.cards}
      currentIndex={props.currentIndex}
      onRate={props.onRate}
      onLevelUp={props.onLevelUp}
      onLevelDown={props.onLevelDown}
      onClose={props.onClose}
      onSkip={props.onSkip}
      onRemoveFromProgress={props.onRemoveFromProgress}
    />
  )
}
