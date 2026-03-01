import { useMemo, useState } from 'react'

import type { StudyMode } from '@/entities/card'
import { loadSession, type PersistedSession } from '@/shared/lib/utils/session-store'
import { updateDeck } from '@/entities/deck'

import type { DeckDetailsProps } from './types'
import { useDeckCards } from './useDeckCards'

export type DeckDetailsViewModel = {
  deckId: string
  deckTitle: string
  deckDescription: string | null
  canEdit: boolean
  showCardTitle: boolean
  setShowCardTitle: (v: boolean) => void
  savingDeckSetting: boolean
  limit: number
  setLimit: (v: number) => void

  saved: PersistedSession | null
  hasSaved: boolean

  limitClamped: number

  cards: import('@/entities/deck').ApiCard[]
  cardsLoading: boolean
  cardsError: string | null
  refreshCards: () => Promise<void>

  // Infinite scroll fields
  totalCards: number
  hasMore: boolean
  loadingMore: boolean
  loadMore: () => Promise<void>

  onBack: () => void
  onResume: () => void
  onStart: (mode: StudyMode) => void
  onEditCard: (cardId: string) => void
  onAddCard: () => void
}

export function useDeckDetailsModel(props: DeckDetailsProps): DeckDetailsViewModel {
  const [limit, setLimit] = useState<number>(20)
  const [sessionVersion, setSessionVersion] = useState(0)
  const [savingDeckSetting, setSavingDeckSetting] = useState(false)

  const {
    deck,
    cards,
    loading: cardsLoading,
    loadingMore,
    error: cardsError,
    refresh: refreshCards,
    totalCards,
    hasMore,
    loadMore,
  } = useDeckCards(props.deckId)

  const key = `deck:${props.deckId}` as const

  const saved = useMemo(() => loadSession(key), [key, sessionVersion])
  const hasSaved = !!saved && (saved.deckCards?.length ?? 0) > 0

  const limitClamped = useMemo(() => {
    const n = Number(limit)
    if (!Number.isFinite(n)) return 20
    return Math.max(1, Math.min(200, Math.trunc(n)))
  }, [limit])

  const onStart = (mode: StudyMode) => {
    if (hasSaved) {
      props.clearSavedSession()
      setSessionVersion(v => v + 1)
    }

    if (mode === 'new_random' || mode === 'new_ordered') props.onStart(mode, limitClamped)
    else props.onStart(mode)
  }

  const onResume = () => {
    if (!saved) return
    props.onResume(saved)
  }

  const onEditCard = (cardId: string) => {
    if (props.onEditCard) props.onEditCard(cardId)
  }

  const onAddCard = () => {
    if (props.onAddCardWithDeckId) {
      props.onAddCardWithDeckId(props.deckId)
    } else if (props.onAddCard) {
      props.onAddCard()
    }
  }

  const setShowCardTitle = async (value: boolean) => {
    setSavingDeckSetting(true)
    try {
      await updateDeck(props.deckId, { show_card_title: value })
      await refreshCards()
    } catch (err) {
      console.error('Failed to update deck setting:', err)
    } finally {
      setSavingDeckSetting(false)
    }
  }

  return {
    deckId: props.deckId,
    deckTitle: deck?.title ?? '',
    deckDescription: deck?.description ?? null,
    canEdit: true,
    showCardTitle: deck?.show_card_title ?? false,
    setShowCardTitle,
    savingDeckSetting,
    limit,
    setLimit,

    saved,
    hasSaved,

    limitClamped,

    cards,
    cardsLoading,
    cardsError,
    refreshCards,

    // Infinite scroll
    totalCards,
    hasMore,
    loadingMore,
    loadMore,

    onBack: props.onBack,
    onResume,
    onStart,
    onEditCard,
    onAddCard,
  }
}
