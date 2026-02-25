// Card domain types
import type { CardContent } from './contentTypes'

export type StudyMode = 'random' | 'ordered' | 'new_random' | 'new_ordered'
export type DifficultyRating = 'again' | 'hard' | 'good' | 'easy'

export interface CardReviewHistoryEntry {
  rating: DifficultyRating
  reviewedAt: string
}

export interface CardLevel {
  levelindex: number
  content: CardContent
  questionImageUrls?: string[]
  answerImageUrls?: string[]
  questionAudioUrls?: string[]
  answerAudioUrls?: string[]
}

export interface StudyCard {
  id: string
  deckId: string
  title: string
  type: string
  levels: CardLevel[]
  activeLevel: number
  activeCardLevelId: string
  questionImageUrl?: string
  questionImageName?: string
  answerImageUrl?: string
  answerImageName?: string
  // optional per-card review history loaded from backend
  reviewHistory?: CardReviewHistoryEntry[]
}

export type StudyCardsResponse = {
  cards: StudyCard[]
  deck: {
    show_card_title: boolean
  }
}

// Analytics / review logging payload (no cardId here; cardId is in the URL)
export interface CardReviewInput {
  rating: DifficultyRating

  // timestamps in ISO for backend to compute think/grade/total
  shownAt: string // ISO
  revealedAt?: string // ISO
  ratedAt: string // ISO

  // optional client metadata
  timezone?: string
}

// API-specific types
export type ApiLevelIn = {
  level_index: number
  content: Record<string, unknown>
  question_image_urls?: string[]
  answer_image_urls?: string[]
  question_audio_urls?: string[]
  answer_audio_urls?: string[]
}

export type ApiReplaceLevelsRequest = {
  levels: ApiLevelIn[]
}

// API request for creating a card - matches backend CreateCardRequest schema
export type ApiCreateCardLevelRequest = {
  question: string
  answer?: string // for flashcard
  options?: Array<{ id: string; text: string; image_url?: string }> // for multiple_choice
  correctOptionId?: string // for multiple_choice
  explanation?: string // for multiple_choice
  timerSec?: number // for multiple_choice
}

export type ApiCreateCardRequest = {
  deck_id: string
  title?: string // Опционально - авто-генерация на бэкенде
  type: string // changed from card_type to match backend
  levels: ApiCreateCardLevelRequest[] // flat structure, not nested
}

export type ApiCreateCardResponse = {
  card_id: string
  deck_id: string
  title: string
  card_type: string
  levels: ApiLevelIn[]
}

// Helper functions
export function isMultipleChoice(card: StudyCard | null | undefined): boolean {
  return !!card && card.type === 'multiple_choice'
}
