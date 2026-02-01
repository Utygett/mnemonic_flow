import type { PublicDeckSummary } from '@/entities/deck'

export type CardSummary = {
  card_id: string
  title: string
  type: string
  levels?: Array<{ level_index: number; content: any }>
}

export interface Props {
  decks: PublicDeckSummary[]
  onCancel: () => void
  onDone: () => void
  onEditDeck?: (deckId: string) => void
}

export type QaLevelDraft = {
  kind: 'qa'
  question: string
  answer: string
  // Media URLs (arrays for multiple files)
  question_image_urls?: string[]
  answer_image_urls?: string[]
  question_audio_urls?: string[]
  answer_audio_urls?: string[]
}

export type McqOptionDraft = { id: string; text: string }
export type McqLevelDraft = {
  kind: 'mcq'
  question: string
  options: McqOptionDraft[]
  correctOptionId: string
  explanation: string
  timerSec: number // 0 = без таймера
  // Media URLs (arrays for multiple files)
  question_image_urls?: string[]
  answer_image_urls?: string[]
  question_audio_urls?: string[]
  answer_audio_urls?: string[]
}

export type LevelDraft = QaLevelDraft | McqLevelDraft
