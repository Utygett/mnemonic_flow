import { useCallback, useEffect, useState } from 'react'

import { getUserDecks } from '@/entities/deck'
import type { PublicDeckSummary } from '@/entities/deck'

export type UseUserDecksResult = {
  decks: PublicDeckSummary[]
  loading: boolean
  error: string | null
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredDecks: PublicDeckSummary[]
  refresh: () => Promise<void>
}

export function useUserDecks(): UseUserDecksResult {
  const [decks, setDecks] = useState<PublicDeckSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchDecks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const userDecks = await getUserDecks()
      setDecks(userDecks)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDecks()
  }, [fetchDecks])

  const filteredDecks = decks.filter(deck => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true
    return (
      deck.title.toLowerCase().includes(query) ||
      (deck.description && deck.description.toLowerCase().includes(query))
    )
  })

  return {
    decks,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filteredDecks,
    refresh: fetchDecks,
  }
}
