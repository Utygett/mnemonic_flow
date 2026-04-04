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
    id: c.card_id,
    deckId: c.deck_id,
    title: c.title,
    type: c.type,
    levels: toCardLevels(c.levels),
    activeLevel: c.active_level ?? 0,
    activeCardLevelId: c.card_level_id ?? c.active_card_level_id ?? '',
    reviewHistory: c.review_history ?? [],
  }))
}
