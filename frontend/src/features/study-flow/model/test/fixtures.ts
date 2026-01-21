import type { CardLevel, StudyCard, DifficultyRating } from '@/entities/card'
import type { PersistedSession } from '@/shared/lib/utils/session-store'

/** Создаёт mock Flashcard карточку */
export function createMockFlashcard(overrides: Partial<StudyCard> = {}): StudyCard {
  return {
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    deckId: 'deck-1',
    title: 'Test Flashcard',
    type: 'flashcard',
    activeLevel: 0,
    levels: [
      {
        levelindex: 0,
        content: {
          question: 'What is 2 + 2?',
          answer: '4',
        },
      },
    ],
    ...overrides,
  }
}

/** Создаёт mock MCQ карточку */
export function createMockMcqCard(overrides: Partial<StudyCard> = {}): StudyCard {
  return {
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    deckId: 'deck-1',
    title: 'Test MCQ',
    type: 'multiple_choice',
    activeLevel: 0,
    levels: [
      {
        levelindex: 0,
        content: {
          question: 'What is 2 + 2?',
          options: [
            { id: 'a', text: '3' },
            { id: 'b', text: '4' },
            { id: 'c', text: '5' },
            { id: 'd', text: '6' },
          ],
          correctOptionId: 'b',
          explanation: '2 + 2 = 4',
          timerSec: 30,
        },
      },
    ],
    ...overrides,
  }
}

/** Создаёт массив из N карточек */
export function createMockCards(
  count: number,
  type: 'flashcard' | 'multiple_choice' = 'flashcard'
): StudyCard[] {
  return Array.from({ length: count }, (_, i) =>
    type === 'flashcard'
      ? createMockFlashcard({ id: `card-${i}`, title: `Card ${i}` })
      : createMockMcqCard({ id: `card-${i}`, title: `MCQ ${i}` })
  )
}

/** Создаёт mock уровень карточки */
export function createMockLevel(overrides: Partial<CardLevel> = {}): CardLevel {
  return {
    levelindex: 0,
    content: {
      question: 'Test question',
      answer: 'Test answer',
    },
    ...overrides,
  }
}

/** Создаёт mock PersistedSession для deck */
export function createMockPersistedSession(
  overrides: Partial<PersistedSession> = {}
): PersistedSession {
  return {
    key: 'deck:deck-1',
    mode: 'deck',
    activeDeckId: 'deck-1',
    deckCards: createMockCards(3),
    currentIndex: 0,
    isStudying: true,
    savedAt: Date.now(),
    ...overrides,
  }
}

/** Создаёт mock CardReviewInput */
export function createMockReviewInput(
  rating: DifficultyRating = 'good',
  overrides: Partial<{ cardId: string; shownAt: string; revealedAt: string; ratedAt: string }> = {}
) {
  const now = new Date().toISOString()
  return {
    rating,
    cardId: 'card-1',
    shownAt: now,
    revealedAt: now,
    ratedAt: now,
    ...overrides,
  }
}

/** Генерирует ISO timestamp с смещением */
export function isoTimestamp(offsetSeconds = 0): string {
  const date = new Date()
  date.setSeconds(date.getSeconds() + offsetSeconds)
  return date.toISOString()
}
