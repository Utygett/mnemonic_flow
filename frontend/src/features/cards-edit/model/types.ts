import type { PublicDeckSummary } from '@/entities/deck'
import type { ApiLevelIn } from '@/entities/card'

export type CardSummary = {
  card_id: string
  title: string
  type: string
  levels?: Array<{ level_index: number; content: any }>
}

export type CardsEditMode = 'full' | 'session'

export type CardSavedPayload = {
  cardId: string
  deckId: string
  title: string
  type: string
  levels: ApiLevelIn[]
}

export interface Props {
  // In session mode we can omit decks; they are only used for deck selection UI and owner-only hints.
  decks?: PublicDeckSummary[]

  // Initial state / session mode constraints
  mode?: CardsEditMode
  initialDeckId?: string
  initialCardId?: string

  onCancel: () => void
  onDone: () => void
  onEditDeck?: (deckId: string) => void

  // Called after a successful save (before onDone).
  onSaved?: (payload: CardSavedPayload) => void
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
  answer_image_urls?: string[]
  question_audio_urls?: string[]
  answer_audio_urls?: string[]
}

export type LevelDraft = QaLevelDraft | McqLevelDraft
