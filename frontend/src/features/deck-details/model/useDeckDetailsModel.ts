import { useEffect, useMemo, useState } from 'react'

import type { StudyMode } from '@/entities/card'
import { deleteCard, moveCardToDeck } from '@/entities/card'
import { loadSession, type PersistedSession } from '@/shared/lib/utils/session-store'
import { updateDeck, getUserDecks } from '@/entities/deck'
import type { PublicDeckSummary } from '@/entities/deck'
import { ApiError } from '@/shared/api/request'

import type { DeckDetailsProps } from './types'
import { useDeckCards } from './useDeckCards'

export type DeckDetailsViewModel = {
  deckId: string
  deckTitle: string
  deckDescription: string | null
  canEdit: boolean
  showCardTitle: boolean
  setShowCardTitle: (v: boolean) => void
  autoAddCardsToStudy: boolean
  setAutoAddCardsToStudy: (v: boolean) => void
  savingDeckSetting: boolean
  isPublic: boolean
  setIsPublic: (v: boolean) => void
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
  editableDecks: PublicDeckSummary[]
  onBack: () => void
  onResume: () => void
  onStart: (mode: StudyMode) => void
  onEditCard: (cardId: string) => void
  onDeleteCard: (cardId: string) => Promise<void>
  onMoveCard: (cardId: string, targetDeckId: string) => Promise<void>
  onAddCard: () => void
}

function getCurrentUserId(): string | null {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub ?? null
  } catch {
    return null
  }
}

export function useDeckDetailsModel(props: DeckDetailsProps): DeckDetailsViewModel {
  const [limit, setLimit] = useState<number>(20)
  const [sessionVersion, setSessionVersion] = useState(0)
  const [savingDeckSetting, setSavingDeckSetting] = useState(false)
  const [editableDecks, setEditableDecks] = useState<PublicDeckSummary[]>([])

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

  const currentUserId = getCurrentUserId()

  useEffect(() => {
    // Filter to decks where current user can edit (owner or granted editor permission)
    getUserDecks()
      .then(decks => {
        const editable = decks.filter(d => d.can_edit === true)
        setEditableDecks(editable as unknown as PublicDeckSummary[])
      })
      .catch(() => {})
  }, [currentUserId])

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

  const onDeleteCard = async (cardId: string) => {
    try {
      if (props.onDeleteCard) {
        await props.onDeleteCard(cardId)
      } else {
        await deleteCard(cardId)
      }
      await refreshCards()
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 403) {
        throw new Error('Нет доступа: вы не можете удалять карточки чужой колоды.')
      }
      throw err
    }
  }

  const onMoveCard = async (cardId: string, targetDeckId: string) => {
    await moveCardToDeck(cardId, targetDeckId)
    await refreshCards()
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

  const setIsPublic = async (value: boolean) => {
    setSavingDeckSetting(true)
    try {
      await updateDeck(props.deckId, { is_public: value })
      await refreshCards()
    } catch (err) {
      console.error('Failed to update deck public status:', err)
    } finally {
      setSavingDeckSetting(false)
    }
  }

  const setAutoAddCardsToStudy = async (value: boolean) => {
    setSavingDeckSetting(true)
    try {
      await updateDeck(props.deckId, { auto_add_cards_to_study: value })
      await refreshCards()
    } catch (err) {
      console.error('Failed to update auto add cards setting:', err)
    } finally {
      setSavingDeckSetting(false)
    }
  }

  // Prefer can_edit from backend; fall back to owner_id comparison for compatibility
  const canEdit =
    deck != null ? (deck.can_edit ?? String(deck.owner_id) === String(currentUserId)) : true

  return {
    deckId: props.deckId,
    deckTitle: deck?.title ?? '',
    deckDescription: deck?.description ?? null,
    canEdit,
    showCardTitle: deck?.show_card_title ?? false,
    setShowCardTitle,
    autoAddCardsToStudy: deck?.auto_add_cards_to_study ?? false,
    setAutoAddCardsToStudy,
    savingDeckSetting,
    isPublic: deck?.is_public ?? false,
    setIsPublic,
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
    editableDecks,
    onBack: props.onBack,
    onResume,
    onStart,
    onEditCard,
    onDeleteCard,
    onMoveCard,
    onAddCard,
  }
}
