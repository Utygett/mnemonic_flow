import { useCallback, useEffect, useState } from 'react'

import { getDeckCardsPaginated, getDeckInfo } from '@/entities/deck'
import type { ApiCard, DeckDetail } from '@/entities/deck'

const PER_PAGE = 15

export type UseDeckCardsResult = {
  deck: DeckDetail | null
  cards: ApiCard[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  refresh: () => Promise<void>
  // Infinite scroll
  totalCards: number
  hasMore: boolean
  loadMore: () => Promise<void>
}

export function useDeckCards(deckId: string): UseDeckCardsResult {
  const [deck, setDeck] = useState<DeckDetail | null>(null)
  const [cards, setCards] = useState<ApiCard[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCards, setTotalCards] = useState(0)

  const fetchDeckInfo = useCallback(async () => {
    try {
      const deckInfo = await getDeckInfo(deckId)
      setDeck(deckInfo)
      setTotalCards(deckInfo.cards_count)
    } catch (err) {
      console.error('Failed to fetch deck info:', err)
    }
  }, [deckId])

  const fetchInitial = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPage(1)
    setCards([])

    try {
      await fetchDeckInfo()
      const paginatedData = await getDeckCardsPaginated(deckId, 1, PER_PAGE)
      setCards(paginatedData.cards)
      setTotalCards(paginatedData.total)
      setTotalPages(paginatedData.total_pages)
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [deckId, fetchDeckInfo])

  const loadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages) return

    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const paginatedData = await getDeckCardsPaginated(deckId, nextPage, PER_PAGE)
      setCards(prev => [...prev, ...paginatedData.cards])
      setPage(nextPage)
    } catch (err) {
      console.error('Failed to load more cards:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [deckId, page, totalPages, loadingMore])

  const refresh = useCallback(async () => {
    setDeck(null)
    await fetchInitial()
  }, [fetchInitial])

  useEffect(() => {
    fetchInitial()
  }, [deckId])

  return {
    deck,
    cards,
    loading,
    loadingMore,
    error,
    refresh,
    totalCards,
    hasMore: page < totalPages,
    loadMore,
  }
}
