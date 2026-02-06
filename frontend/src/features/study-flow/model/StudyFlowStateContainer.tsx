import React from 'react'

import type { DifficultyRating, StudyCard, StudyMode, CardReviewInput } from '@/entities/card'
import { deleteCardProgress, levelDown, levelUp } from '@/entities/card'

import type { PersistedSession } from '@/shared/lib/utils/session-store'
import { saveSession, clearSession } from '@/shared/lib/utils/session-store'

import { useStudySession } from './hooks/useStudySession'
import { useResumeCandidate } from './hooks/useResumeCandidate'
import { useStudyLauncher } from './hooks/useStudyLauncher'
import { StudyFlowView } from '../ui/StudyFlowView'

export type StudyController = {
  resumeCandidate: PersistedSession | null
  onResume: () => void
  onDiscardResume: () => void

  onStartReviewStudy: () => Promise<void>
  onStartDeckStudy: (deckId: string, mode: StudyMode, limit?: number) => Promise<void>
  onResumeDeckSession: (saved: PersistedSession) => void
  onRestartDeckSession: (deckId: string) => void

  isStudying: boolean
}

type Props = {
  onExitToHome: () => void
  onRated: () => void
  children: (api: StudyController) => React.ReactNode
}

export type RatingCounts = Record<DifficultyRating, number>

export type SessionStats = {
  startedAtMs: number | null
  finishedAtMs: number | null
  ratedCount: number
  ratingCounts: RatingCounts

  // Total time spent for stats, accumulated per rated card (capped per card).
  spentMs: number
}

const emptyRatingCounts = (): RatingCounts => ({
  again: 0,
  hard: 0,
  good: 0,
  easy: 0,
})

const MAX_CARD_VIEW_MS = 60_000

export function StudyFlowStateContainer({ onExitToHome, onRated, children }: Props) {
  const [isStudying, setIsStudying] = React.useState(false)
  const [loadingDeckCards, setLoadingDeckCards] = React.useState(false)
  const showStudy = isStudying || loadingDeckCards

  const [sessionMode, setSessionMode] = React.useState<'deck' | 'review'>('review')
  const [sessionKey, setSessionKey] = React.useState<'review' | `deck:${string}`>('review')
  const [activeDeckId, setActiveDeckId] = React.useState<string | null>(null)

  const [deckCards, setDeckCards] = React.useState<StudyCard[]>([])
  const [sessionIndex, setSessionIndex] = React.useState(0)

  // Session statistics state
  const [sessionStartedAtMs, setSessionStartedAtMs] = React.useState<number | null>(null)
  const [sessionFinishedAtMs, setSessionFinishedAtMs] = React.useState<number | null>(null)
  const [ratingCounts, setRatingCounts] = React.useState<RatingCounts>(emptyRatingCounts())
  const [ratedCount, setRatedCount] = React.useState(0)
  const [spentMs, setSpentMs] = React.useState(0)

  const { cards, currentIndex, isCompleted, rateCard, skipCard, resetSession } = useStudySession(
    deckCards,
    sessionIndex
  )

  const {
    resumeCandidate,
    setResumeCandidate,
    resumeLastSession: onResume,
    discardResume: onDiscardResume,
  } = useResumeCandidate({
    isStudying,
    loadingDeckCards,
    sessionKey,
    sessionMode,
    activeDeckId,
    deckCards,
    currentIndex,
    setIsStudying,
    setSessionMode,
    setSessionKey,
    setActiveDeckId,
    setSessionIndex,
    setDeckCards,
  })

  const launcherInput = React.useMemo(
    () => ({
      setLoadingDeckCards,
      setDeckCards,
      setActiveDeckId,
      setIsStudying,
      setSessionMode,
      setSessionKey,
      setSessionIndex,
    }),
    []
  )

  const {
    startDeckStudy: onStartDeckStudy,
    startReviewStudy: onStartReviewStudy,
    resumeDeckSession: onResumeDeckSession,
    restartDeckSession: onRestartDeckSession,
  } = useStudyLauncher(launcherInput)

  // Initialize session start time when study begins
  React.useEffect(() => {
    if (!showStudy) return
    if (loadingDeckCards) return
    if (deckCards.length === 0) return
    if (sessionStartedAtMs != null) return

    setSessionStartedAtMs(Date.now())
    setSessionFinishedAtMs(null)
    setRatingCounts(emptyRatingCounts())
    setRatedCount(0)
    setSpentMs(0)
  }, [showStudy, loadingDeckCards, deckCards.length, sessionStartedAtMs])

  React.useEffect(() => {
    if (!isStudying) return
    setSessionIndex(currentIndex)
  }, [currentIndex, isStudying])

  // Mark session as finished when completed
  React.useEffect(() => {
    if (!isStudying) return
    if (!isCompleted) return
    if (sessionFinishedAtMs != null) return

    setSessionFinishedAtMs(Date.now())
  }, [isCompleted, isStudying, sessionFinishedAtMs])

  React.useEffect(() => {
    if (!isStudying) return
    if (!isCompleted) return

    clearSession(sessionKey)
    setResumeCandidate(null)

    // Don't reset stats here - they will be shown on completion screen
    // Stats will be reset when starting a new session
  }, [isCompleted, isStudying, sessionKey, setResumeCandidate])

  const handleLevelUp = async () => {
    const card = cards[currentIndex]
    if (!card) return

    const r: any = await levelUp(card.id)
    const nextLevel = typeof r?.active_level === 'number' ? r.active_level : card.activeLevel
    setDeckCards(prev => prev.map(c => (c.id === card.id ? { ...c, activeLevel: nextLevel } : c)))
  }

  const handleLevelDown = async () => {
    const card = cards[currentIndex]
    if (!card) return

    const r: any = await levelDown(card.id)
    const nextLevel = typeof r?.active_level === 'number' ? r.active_level : card.activeLevel
    setDeckCards(prev => prev.map(c => (c.id === card.id ? { ...c, activeLevel: nextLevel } : c)))
  }

  const handleRemoveFromProgress = async () => {
    const card = cards[currentIndex]
    if (!card) return
    await deleteCardProgress(card.id)
    skipCard()
  }

  const handleRate = async (review: CardReviewInput) => {
    // Update rating statistics
    const rating = review.rating as DifficultyRating
    setRatingCounts(prev => ({ ...prev, [rating]: (prev[rating] ?? 0) + 1 }))
    setRatedCount(prev => prev + 1)

    // Accumulate per-card spent time and cap it to 1 minute.
    const shownAtMs = Date.parse(String((review as any)?.shownAt ?? ''))
    const ratedAtMs = Date.parse(String((review as any)?.ratedAt ?? ''))
    const raw =
      Number.isFinite(shownAtMs) && Number.isFinite(ratedAtMs) ? Math.max(0, ratedAtMs - shownAtMs) : 0
    const capped = Math.min(raw, MAX_CARD_VIEW_MS)
    setSpentMs(prev => prev + capped)

    await rateCard(review)
    onRated()
  }

  const resetStats = () => {
    setSessionStartedAtMs(null)
    setSessionFinishedAtMs(null)
    setRatingCounts(emptyRatingCounts())
    setRatedCount(0)
    setSpentMs(0)
  }

  const handleCloseStudy = () => {
    if (deckCards.length > 0) {
      const snap: PersistedSession = {
        key: sessionKey,
        mode: sessionMode,
        activeDeckId,
        deckCards,
        currentIndex,
        isStudying: true,
        savedAt: Date.now(),
      }
      saveSession(snap)
      setResumeCandidate(snap)
    }

    setIsStudying(false)
    setDeckCards([])
    setSessionIndex(0)
    resetSession()
    resetStats()
    onExitToHome()
  }

  const handleBackToHome = () => {
    setIsStudying(false)
    setDeckCards([])
    setSessionIndex(0)
    resetSession()
    resetStats()
    onExitToHome()
  }

  const sessionStats: SessionStats = {
    startedAtMs: sessionStartedAtMs,
    finishedAtMs: sessionFinishedAtMs,
    ratedCount,
    ratingCounts,
    spentMs,
  }

  return (
    <>
      {showStudy ? (
        <StudyFlowView
          isStudying={showStudy}
          loadingDeckCards={loadingDeckCards}
          deckCards={deckCards}
          cards={cards}
          currentIndex={currentIndex}
          isCompleted={isCompleted}
          onRate={handleRate}
          onLevelUp={handleLevelUp}
          onLevelDown={handleLevelDown}
          onSkip={skipCard}
          onRemoveFromProgress={handleRemoveFromProgress}
          onClose={handleCloseStudy}
          onBackToHome={handleBackToHome}
          sessionStats={sessionStats}
        />
      ) : (
        children({
          resumeCandidate,
          onResume,
          onDiscardResume,
          onStartReviewStudy,
          onStartDeckStudy,
          onResumeDeckSession,
          onRestartDeckSession,
          isStudying,
        })
      )}
    </>
  )
}
