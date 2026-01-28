// Card domain types
import type { CardContent } from './contentTypes'

export type StudyMode = 'random' | 'ordered' | 'new_random' | 'new_ordered'
export type DifficultyRating = 'again' | 'hard' | 'good' | 'easy'

export interface CardLevel {
  levelindex: number
  content: CardContent
  questionImageUrl?: string
  answerImageUrl?: string
  questionAudioUrl?: string
  answerAudioUrl?: string
}

export interface StudyCard {
  id: string
  deckId: string
  title: string
  type: string
  levels: CardLevel[]
  activeLevel: number
  questionImageUrl?: string
  questionImageName?: string
  answerImageUrl?: string
  answerImageName?: string
}

export type StudyCardsResponse = {
  cards: StudyCard[]
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
  title: string
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
