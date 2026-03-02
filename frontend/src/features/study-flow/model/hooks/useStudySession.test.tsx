import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useStudySession } from './useStudySession'
import { createMockCards, createMockReviewInput } from '../test/fixtures'

// Мокаем @/entities/card
vi.mock('@/entities/card', () => ({
  reviewCardWithMeta: vi.fn(),
}))

const { reviewCardWithMeta } = await import('@/entities/card')

// QueryClient wrapper for tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const createWrapper = () => {
  const queryClient = createTestQueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useStudySession', () => {
  const renderHookWithWrapper = (callback: () => any) =>
    renderHook(callback, { wrapper: createWrapper() })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('начальное состояние', () => {
    it('должен установить currentIndex из initialIndex', () => {
      const mockCards = createMockCards(5)
      const { result } = renderHookWithWrapper(() => useStudySession(mockCards, 2))

      expect(result.current.currentIndex).toBe(2)
    })

    it('должен использовать 0 как начальный индекс если initialIndex не передан', () => {
      const mockCards = createMockCards(5)
      const { result } = renderHookWithWrapper(() => useStudySession(mockCards, undefined))

      expect(result.current.currentIndex).toBe(0)
    })

    it('должен возвращать переданные cards', () => {
      const mockCards = createMockCards(3)
      const { result } = renderHookWithWrapper(() => useStudySession(mockCards, 0))

      expect(result.current.cards).toEqual(mockCards)
    })

    it('должен возвращать пустой массив если cards undefined', () => {
      const { result } = renderHookWithWrapper(() => useStudySession(undefined as any, 0))

      expect(result.current.cards).toEqual([])
    })

    describe('isCompleted', () => {
      it('должен быть false когда currentIndex меньше cards.length', () => {
        const mockCards = createMockCards(5)
        const { result } = renderHookWithWrapper(() => useStudySession(mockCards, 0))

        expect(result.current.isCompleted).toBe(false)
      })

      it('должен быть true когда currentIndex >= cards.length', () => {
        const mockCards = createMockCards(3)
        const { result } = renderHookWithWrapper(() => useStudySession(mockCards, 3))

        expect(result.current.isCompleted).toBe(true)
      })

      it('должен быть false для пустого массива карточек', () => {
        const { result } = renderHookWithWrapper(() => useStudySession([], 0))

        expect(result.current.isCompleted).toBe(false)
      })
    })
  })

  describe('rateCard', () => {
    it('должен вызывать API с корректными данными', async () => {
      const mockCards = createMockCards(3)
      const mockReview = createMockReviewInput('good', {
        cardId: mockCards[0].id,
      })

      vi.mocked(reviewCardWithMeta).mockResolvedValue(undefined as any)

      const { result } = renderHookWithWrapper(() => useStudySession(mockCards, 0))

      await act(async () => {
        await result.current.rateCard(mockReview)
      })

      expect(reviewCardWithMeta).toHaveBeenCalledWith(mockCards[0].id, {
        rating: 'good',
        cardId: mockCards[0].id,
        shownAt: mockReview.shownAt,
        revealedAt: mockReview.revealedAt,
        ratedAt: mockReview.ratedAt,
        timezone: expect.any(String),
      })
    })

    it('должен добавлять timezone если не передан', async () => {
      const mockCards = createMockCards(1)
      const mockReview = createMockReviewInput('hard', { timezone: undefined })

      vi.mocked(reviewCardWithMeta).mockResolvedValue(undefined as any)

      const { result } = renderHookWithWrapper(() => useStudySession(mockCards, 0))

      await act(async () => {
        await result.current.rateCard(mockReview)
      })

      expect(reviewCardWithMeta).toHaveBeenCalledWith(
        mockCards[0].id,
        expect.objectContaining({
          timezone: expect.stringMatching(/^[A-Z]/),
        })
      )
    })

    it('должен продвигать currentIndex после оценки', async () => {
      const mockCards = createMockCards(3)
      vi.mocked(reviewCardWithMeta).mockResolvedValue(undefined as any)

      const { result } = renderHookWithWrapper(() => useStudySession(mockCards, 0))

      expect(result.current.currentIndex).toBe(0)

      await act(async () => {
        await result.current.rateCard(createMockReviewInput('good'))
      })

      expect(result.current.currentIndex).toBe(1)
    })

    it('должен игнорировать ошибки API (non-blocking)', async () => {
      const mockCards = createMockCards(3)
      vi.mocked(reviewCardWithMeta).mockRejectedValue(new Error('API Error'))

      const { result } = renderHookWithWrapper(() => useStudySession(mockCards, 0))

      await act(async () => {
        await result.current.rateCard(createMockReviewInput('again'))
      })

      // Ошибка не должна прервать flow
      expect(result.current.currentIndex).toBe(1)
    })

    it('не должен вызывать API если текущая карточка отсутствует', async () => {
      vi.mocked(reviewCardWithMeta).mockResolvedValue(undefined as any)

      const { result } = renderHookWithWrapper(() => useStudySession([], 0))

      await act(async () => {
        await result.current.rateCard(createMockReviewInput('good'))
      })

      expect(reviewCardWithMeta).not.toHaveBeenCalled()
    })
  })

  describe('skipCard', () => {
    it('должен продвигать currentIndex без вызова API', () => {
      const mockCards = createMockCards(3)
      const { result } = renderHookWithWrapper(() => useStudySession(mockCards, 0))

      expect(result.current.currentIndex).toBe(0)

      act(() => {
        result.current.skipCard()
      })

      expect(result.current.currentIndex).toBe(1)
      expect(reviewCardWithMeta).not.toHaveBeenCalled()
    })
  })

  describe('resetSession', () => {
    it('должен сбросить currentIndex в 0', () => {
      const mockCards = createMockCards(5)
      const { result } = renderHookWithWrapper(() => useStudySession(mockCards, 3))

      expect(result.current.currentIndex).toBe(3)

      act(() => {
        result.current.resetSession()
      })

      expect(result.current.currentIndex).toBe(0)
    })
  })

  describe('эффект при изменении initialIndex', () => {
    it('должен начинать с указанным initialIndex', () => {
      const mockCards = createMockCards(5)

      const { result: result0 } = renderHookWithWrapper(() => useStudySession(mockCards, 0))
      expect(result0.current.currentIndex).toBe(0)

      const { result: result2 } = renderHookWithWrapper(() => useStudySession(mockCards, 2))
      expect(result2.current.currentIndex).toBe(2)

      const { result: result4 } = renderHookWithWrapper(() => useStudySession(mockCards, 4))
      expect(result4.current.currentIndex).toBe(4)
    })
  })
})
