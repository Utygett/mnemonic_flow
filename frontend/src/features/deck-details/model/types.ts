import type { StudyMode } from '@/entities/card'
import type { PersistedSession } from '@/shared/lib/utils/session-store'

export type DeckDetailsProps = {
  deckId: string
  onBack: () => void
  onStart: (mode: StudyMode, limit?: number) => void
  onResume: (saved: PersistedSession) => void
  clearSavedSession: () => void // без deckId
}
