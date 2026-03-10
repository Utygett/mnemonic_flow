import type { StudyMode } from '@/entities/card'

export type DeckStudyAllProps = {
  onStudyStart: (deckId: string, mode: StudyMode) => void
  onBack: () => void
}
