import { useCallback, useEffect, useState } from 'react'

import { getDeckWithCards } from '@/entities/deck'
import type { ApiDeckWithCards, ApiCard } from '@/entities/deck'

export type UseDeckCardsResult = {
  deck: ApiDeckWithCards | null
  cards: ApiCard[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useDeckCards(deckId: string): UseDeckCardsResult {
  const [deck, setDeck] = useState<ApiDeckWithCards | null>(null)
  const [cards, setCards] = useState<ApiCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDeckWithCards(deckId)
      setDeck(data)
      setCards(data.cards ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [deckId])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { deck, cards, loading, error, refresh: fetch }
}
