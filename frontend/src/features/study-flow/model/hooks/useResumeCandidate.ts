import { useEffect, useState } from 'react'

import {
  clearSession,
  loadLastSession,
  saveSession,
  type PersistedSession,
} from '@/shared/lib/utils/session-store'

type Input = {
  isStudying: boolean
  loadingDeckCards: boolean
  sessionKey: PersistedSession['key']
  sessionMode: PersistedSession['mode']
  activeDeckId: string | null
  deckCards: PersistedSession['deckCards']
  currentIndex: number

  setIsStudying: (v: boolean) => void
  setSessionMode: (v: PersistedSession['mode']) => void
  setSessionKey: (v: PersistedSession['key']) => void
  setActiveDeckId: (v: string | null) => void
  setSessionIndex: (v: number) => void
  setDeckCards: (v: PersistedSession['deckCards']) => void
}

export function useResumeCandidate(input: Input) {
  const [resumeCandidate, setResumeCandidate] = useState<PersistedSession | null>(null)

  useEffect(() => {
    const saved = loadLastSession()
    if (!saved || !saved.isStudying) {
      setResumeCandidate(null)
      return
    }
    setResumeCandidate(saved)
  }, [])

  useEffect(() => {
    if (!input.isStudying) return
    if (input.loadingDeckCards) return
    if (input.deckCards.length === 0) return

    saveSession({
      key: input.sessionKey,
      mode: input.sessionMode,
      activeDeckId: input.activeDeckId,
      deckCards: input.deckCards,
      currentIndex: input.currentIndex,
      isStudying: true,
      savedAt: Date.now(),
    })

    setResumeCandidate(loadLastSession())
  }, [
    input.isStudying,
    input.loadingDeckCards,
    input.sessionKey,
    input.sessionMode,
    input.activeDeckId,
    input.deckCards,
    input.currentIndex,
  ])

  const resumeLastSession = () => {
    const saved = resumeCandidate
    if (!saved) return

    input.setSessionMode(saved.mode)
    input.setSessionKey(saved.key)
    input.setActiveDeckId(saved.activeDeckId)
    input.setSessionIndex(saved.currentIndex ?? 0)
    input.setDeckCards(saved.deckCards ?? [])
    input.setIsStudying(true)

    setResumeCandidate(null)
  }

  const discardResume = () => {
    if (!resumeCandidate) return
    clearSession(resumeCandidate.key)
    setResumeCandidate(null)
  }

  return { resumeCandidate, setResumeCandidate, resumeLastSession, discardResume }
}
