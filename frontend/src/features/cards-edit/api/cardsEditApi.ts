import { apiRequest } from '@/shared/api/request'

import { getDeckWithCards, deleteDeck as deleteDeckEntity } from '@/entities/deck'
import {
  replaceCardLevels as replaceCardLevelsEntity,
  deleteCard as deleteCardEntity,
} from '@/entities/card'
import type { ApiLevelIn } from '@/entities/card'

export async function loadDeckWithCards(deckId: string) {
  return getDeckWithCards(deckId)
}

export async function replaceCardLevels(cardId: string, levels: ApiLevelIn[]) {
  return replaceCardLevelsEntity(cardId, levels)
}

export async function deleteCard(cardId: string) {
  return deleteCardEntity(cardId)
}

export async function deleteDeck(deckId: string) {
  return deleteDeckEntity(deckId)
}

export async function updateCardTitle(cardId: string, title: string) {
  // Backend supports PATCH with title in query
  const qs = new URLSearchParams({ title })
  await apiRequest<void>(`/cards/${cardId}?${qs.toString()}`, {
    method: 'PATCH',
  })
}
