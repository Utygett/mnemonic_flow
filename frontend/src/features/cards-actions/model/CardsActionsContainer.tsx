import React from 'react'

import { createCard } from '@/entities/card'
import { toApiRequest } from '../lib/toApiRequest'
import { ApiError } from '@/shared/api'

export type CardsActionsApi = {
  onCreateCardSave: (cardData: any) => Promise<void>
  onCreateCardSaveMany: (
    cards: any[]
  ) => Promise<{ created: number; failed: number; errors: string[] }>
  onEditCardDone: () => void
}

type Props = {
  refreshDecks: () => void
  refreshStats: () => void
  closeCreateCard: () => void
  closeEditCard: () => void
  children: (api: CardsActionsApi) => React.ReactNode
}

export function CardsActionsContainer({
  refreshDecks,
  refreshStats,
  closeCreateCard,
  closeEditCard,
  children,
}: Props) {
  const onCreateCardSave = async (cardData: any) => {
    try {
      await createCard(toApiRequest(cardData))
      refreshDecks()
      refreshStats()
      closeCreateCard()
    } catch (e: any) {
      // Handle duplicate card error (409 Conflict)
      if (e instanceof ApiError && e.status === 409) {
        const message = e.detail || 'Карточка с таким названием уже существует в этой колоде'
        alert(message)
        throw e // Re-throw to prevent closing the form
      }
      throw e // Re-throw other errors
    }
  }

  const onCreateCardSaveMany = async (cards: any[]) => {
    const errors: string[] = []
    let created = 0

    for (let i = 0; i < cards.length; i++) {
      const c = cards[i]
      try {
        await createCard(toApiRequest(c))
        created++
      } catch (e: any) {
        const errorMsg =
          e instanceof ApiError && e.status === 409
            ? `Карточка "${c.term}" уже существует в колоде`
            : String(e?.detail || e?.message || e)
        errors.push(`${i + 1}: ${errorMsg}`)
      }
    }

    refreshDecks()
    refreshStats()
    return { created, failed: errors.length, errors }
  }

  const onEditCardDone = () => {
    refreshDecks()
    refreshStats()
    closeEditCard()
  }

  return <>{children({ onCreateCardSave, onCreateCardSaveMany, onEditCardDone })}</>
}
