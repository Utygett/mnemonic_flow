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

export function StudyFlowStateContainer({ onExitToHome, onRated, children }: Props) {
  const [isStudying, setIsStudying] = React.useState(false)
  const [loadingDeckCards, setLoadingDeckCards] = React.useState(false)
  const showStudy = isStudying || loadingDeckCards

  const [sessionMode, setSessionMode] = React.useState<'deck' | 'review'>('review')
  const [sessionKey, setSessionKey] = React.useState<'review' | `deck:${string}`>('review')
  const [activeDeckId, setActiveDeckId] = React.useState<string | null>(null)

  const [deckCards, setDeckCards] = React.useState<StudyCard[]>([])
  const [sessionIndex, setSessionIndex] = React.useState(0)

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

  React.useEffect(() => {
    if (!isStudying) return
    setSessionIndex(currentIndex)
  }, [currentIndex, isStudying])

  React.useEffect(() => {
    if (!isStudying) return
    if (!isCompleted) return

    clearSession(sessionKey)
    setResumeCandidate(null)

    setIsStudying(false)
    setDeckCards([])
    setSessionIndex(0)
    resetSession()
    onExitToHome()
  }, [isCompleted, isStudying, sessionKey, resetSession, onExitToHome, setResumeCandidate])

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
    await rateCard(review)
    onRated()
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
    onExitToHome()
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
          onBackToHome={handleCloseStudy}
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
