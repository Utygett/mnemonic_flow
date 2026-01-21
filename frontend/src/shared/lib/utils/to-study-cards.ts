// src/shared/lib/utils/to-study-cards.ts
import type { StudyCard } from '@/entities/card'

export const toStudyCards = (items: any[]): StudyCard[] =>
  items.map((c: any) => ({
    id: c.card_id,
    deckId: c.deck_id,
    title: c.title,
    type: c.type,
    levels: c.levels ?? [],
    activeLevel: c.active_level ?? 0,
  }))
