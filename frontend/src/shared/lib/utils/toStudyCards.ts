// src/shared/lib/utils/toStudyCards.ts
import type { StudyCard } from '@/entities/card'

export function toStudyCards(items: any[]): StudyCard[] {
  return items.map((c: any) => ({
    id: c.card_id,
    deckId: c.deck_id,
    title: c.title,
    type: c.type,
    levels: c.levels ?? [],
    activeLevel: c.active_level ?? 0,
  }))
}
