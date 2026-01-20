import type { PublicDeckSummary } from '@/entities/deck'

export type CardType = 'flashcard' | 'multiple_choice'

export type LevelQA = {
  question: string
  answer: string
  timerSec?: number
}

export type McqOption = {
  id: string
  text: string
}

export type LevelMCQ = {
  question: string
  options: McqOption[]
  correctOptionId: string
  explanation?: string
  timerSec?: number
}

export type CreateCardData =
  | {
      deckId: string
      term: string
      type: 'flashcard'
      levels: Array<{ question: string; answer: string; timerSec?: number }>
    }
  | {
      deckId: string
      term: string
      type: 'multiple_choice'
      levels: Array<{
        question: string
        options: Array<{ id: string; text: string }>
        correctOptionId: string
        explanation?: string
        timerSec?: number
      }>
    }

export type CreateCardBulkItem = {
  deckId: string
  term: string
  type: 'flashcard'
  levels: Array<{ question: string; answer: string; timerSec?: number }>
}

export type CreateCardBulkResult = {
  created: number
  failed: number
  errors?: string[]
}

export interface CreateCardProps {
  decks: PublicDeckSummary[]
  onSave: (cardData: CreateCardData) => void
  onSaveMany: (cards: CreateCardBulkItem[]) => Promise<CreateCardBulkResult>
  onCancel: () => void
}
