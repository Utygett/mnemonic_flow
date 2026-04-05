// src/shared/lib/utils/toStudyCards.ts
import type { StudyCard } from '@/entities/card'

function toCardLevels(levels: any[] | undefined): any[] {
  if (!levels) return []
  return levels.map((l: any) => ({
    levelindex: l.level_index,
    content: l.content,
    questionImageUrls: l.question_image_urls,
    answerImageUrls: l.answer_image_urls,
    questionAudioUrls: l.question_audio_urls,
    answerAudioUrls: l.answer_audio_urls,
  }))
}

export function toStudyCards(items: any[]): StudyCard[] {
  return items.map((c: any) => ({
    id: c.card_id ?? c.id,
    deckId: c.deck_id ?? c.deckId,
    deckOwnerId: c.deck_owner_id ?? c.deckOwnerId ?? '',
    title: c.title,
    type: c.type,
    levels: toCardLevels(c.levels),
    activeLevel: c.active_level ?? c.activeLevel ?? 0,
    activeCardLevelId: c.card_level_id ?? c.active_card_level_id ?? c.activeCardLevelId ?? '',
    reviewHistory: c.review_history ?? c.reviewHistory ?? [],
  }))
}
