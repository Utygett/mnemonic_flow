import { describe, it, expect } from 'vitest'
import { isMultipleChoice } from './studyCardTypes'
import { createMockFlashcard, createMockMcqCard } from './test/fixtures'

describe('isMultipleChoice', () => {
  describe('определение типа карточки', () => {
    it('должен вернуть true для multiple_choice карточки', () => {
      const mcqCard = createMockMcqCard()
      expect(isMultipleChoice(mcqCard)).toBe(true)
    })

    it('должен вернуть false для flashcard карточки', () => {
      const flashcard = createMockFlashcard()
      expect(isMultipleChoice(flashcard)).toBe(false)
    })
  })

  describe('обработка null и undefined', () => {
    it('должен вернуть false для null', () => {
      expect(isMultipleChoice(null)).toBe(false)
    })

    it('должен вернуть false для undefined', () => {
      expect(isMultipleChoice(undefined)).toBe(false)
    })
  })
})
