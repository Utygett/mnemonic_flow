import { useCallback, useEffect, useMemo, useState, useRef } from 'react'

import type { CardReviewInput, DifficultyRating, StudyCard } from '@/entities/card'
import { reviewCardWithMeta } from '@/entities/card'

type Result = {
  cards: StudyCard[]
  currentIndex: number
  isCompleted: boolean
  rateCard: (review: CardReviewInput) => Promise<void>
  skipCard: () => void
  resetSession: () => void
}

export function useStudySession(deckCards: StudyCard[], initialIndex: number): Result {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex ?? 0)
  const prevDeckCardsRef = useRef(deckCards)

  if (prevDeckCardsRef.current !== deckCards && deckCards.length > 0) {
    prevDeckCardsRef.current = deckCards
    setCurrentIndex(initialIndex ?? 0)
  }

  const cards = useMemo(() => deckCards ?? [], [deckCards])

  const isCompleted = cards.length > 0 ? currentIndex >= cards.length : false

  const skipCard = useCallback(() => {
    setCurrentIndex(i => i + 1)
  }, [])

  const resetSession = useCallback(() => {
    setCurrentIndex(0)
  }, [])

  const rateCard = useCallback(
    async (review: CardReviewInput) => {
      const card = cards[currentIndex]
      if (!card) return

      const payload: CardReviewInput = {
        ...review,
        timezone: review.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      }

      // server-side rating (non-blocking for UI)
      try {
        await reviewCardWithMeta(card.id, payload)
      } catch {
        // ignore: rating is best-effort
      }

      setCurrentIndex(i => i + 1)
    },
    [cards, currentIndex]
  )

  return { cards, currentIndex, isCompleted, rateCard, skipCard, resetSession }
}
