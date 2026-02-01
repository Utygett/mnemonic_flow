import { describe, it, expect } from 'vitest'
import { toApiRequest, type CardData } from './toApiRequest'

describe('toApiRequest', () => {
  describe('базовая трансформация', () => {
    it('должен преобразовать camelCase в snake_case для полей deck_id и title', () => {
      const cardData: CardData = {
        deckId: 'deck-123',
        term: 'Card Title',
        type: 'basic',
        levels: [],
      }
      const result = toApiRequest(cardData)
      expect(result).toEqual({
        deck_id: 'deck-123',
        title: 'Card Title',
        type: 'basic',
        levels: [],
      })
    })
  })

  describe('трансформация levels', () => {
    it('должен извлекать content из вложенной структуры', () => {
      const cardData: CardData = {
        deckId: 'deck-123',
        term: 'Card',
        type: 'basic',
        levels: [
          {
            level_index: 0,
            content: { question: 'Q?', answer: 'A' },
          },
        ],
      }
      const result = toApiRequest(cardData)
      expect(result.levels).toEqual([{ question: 'Q?', answer: 'A' }])
    })

    it('должен работать с плоской структурой level', () => {
      const cardData: CardData = {
        deckId: 'deck-123',
        term: 'Card',
        type: 'basic',
        levels: [{ question: 'Q?', answer: 'A' }],
      }
      const result = toApiRequest(cardData)
      expect(result.levels).toEqual([{ question: 'Q?', answer: 'A' }])
    })

    it('должен использовать пустую строку для question если отсутствует', () => {
      const cardData: CardData = {
        deckId: 'deck-123',
        term: 'Card',
        type: 'basic',
        levels: [{ answer: 'A' }],
      }
      const result = toApiRequest(cardData)
      expect(result.levels).toEqual([{ question: '', answer: 'A' }])
    })
  })

  describe('MCQ тип карточки', () => {
    it('должен трансформировать все поля MCQ уровня', () => {
      const cardData: CardData = {
        deckId: 'deck-123',
        term: 'Math Quiz',
        type: 'mcq',
        levels: [
          {
            content: {
              question: '2 + 2 = ?',
              answer: '4',
              options: ['3', '4', '5'],
              correctOptionId: 1,
              explanation: '2 + 2 = 4',
              timerSec: 30,
            },
          },
        ],
      }
      const result = toApiRequest(cardData)
      expect(result.levels).toEqual([
        {
          question: '2 + 2 = ?',
          answer: '4',
          options: ['3', '4', '5'],
          correctOptionId: 1,
          explanation: '2 + 2 = 4',
          timerSec: 30,
        },
      ])
    })
  })

  describe('несколько levels', () => {
    it('должен трансформировать все уровни', () => {
      const cardData: CardData = {
        deckId: 'deck-123',
        term: 'Multi-level Card',
        type: 'basic',
        levels: [
          { question: 'Q1?', answer: 'A1' },
          { question: 'Q2?', answer: 'A2' },
        ],
      }
      const result = toApiRequest(cardData)
      expect(result.levels).toHaveLength(2)
      expect(result.levels[0]).toEqual({ question: 'Q1?', answer: 'A1' })
      expect(result.levels[1]).toEqual({ question: 'Q2?', answer: 'A2' })
    })
  })
})
