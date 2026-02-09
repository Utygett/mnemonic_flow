import React from 'react'

import type { PublicDeckSummary } from '@/entities/deck'
import type { Statistics } from '@/entities/statistics'
import type { PersistedSession } from '@/shared/lib/utils/session-store'

import { Button } from '../../../shared/ui/Button/Button'
import { ResumeSessionCard } from '@/features/study-flow'

import { DashboardStats } from './components/DashboardStats'

import styles from './DashboardView.module.css'

type Props = {
  statistics: Statistics
  decks: PublicDeckSummary[]
  resumeCandidate: PersistedSession | null
  onResume: () => void
  onDiscardResume: () => void
  onStartStudy: () => void
}

function buildResumeSession(
  resume: PersistedSession,
  decks: PublicDeckSummary[],
  onResume: () => void,
  onDiscard: () => void
) {
  const subtitle =
    resume.mode === 'review'
      ? 'Учебная сессия'
      : (decks.find(d => d.deck_id === resume.activeDeckId)?.title ?? 'Колода')

  return {
    title: 'Продолжить сессию',
    subtitle,
    cardInfo: `Карточка ${resume.currentIndex + 1} из ${resume.deckCards.length}`,
    onResume,
    onDiscard,
  }
}

export function HomeDashboardView(props: Props) {
  const resumeSession = props.resumeCandidate
    ? buildResumeSession(props.resumeCandidate, props.decks, props.onResume, props.onDiscardResume)
    : undefined

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <DashboardStats statistics={props.statistics} />
        </div>
      </div>

      {resumeSession && <ResumeSessionCard {...resumeSession} />}

      <div className={styles.actionSection}>
        <Button onClick={props.onStartStudy} variant="primary" size="large" fullWidth>
          Начать обучение
        </Button>
      </div>
    </div>
  )
}
