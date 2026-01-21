import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStudyLauncher } from './useStudyLauncher'
import { createMockCards, createMockPersistedSession } from '../test/fixtures'

// Мокаем @/entities/card
vi.mock('@/entities/card', () => ({
  getStudyCards: vi.fn(),
  getReviewSession: vi.fn(),
}))

// Мокаем toStudyCards
vi.mock('@/shared/lib/utils/toStudyCards', () => ({
  toStudyCards: vi.fn(items => items),
}))

// Мокаем session-store
vi.mock('@/shared/lib/utils/session-store', () => ({
  clearSession: vi.fn(),
}))

// Мокаем alert
global.alert = vi.fn()

const { getStudyCards, getReviewSession } = await import('@/entities/card')
const { clearSession } = await import('@/shared/lib/utils/session-store')

describe('useStudyLauncher', () => {
  const mockInput = {
    setLoadingDeckCards: vi.fn(),
    setDeckCards: vi.fn(),
    setActiveDeckId: vi.fn(),
    setIsStudying: vi.fn(),
    setSessionMode: vi.fn(),
    setSessionKey: vi.fn(),
    setSessionIndex: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('startDeckStudy', () => {
    it('должен запустить сессию в режиме ordered', async () => {
      const mockCards = createMockCards(3)
      vi.mocked(getStudyCards).mockResolvedValue({ cards: mockCards })

      const { result } = renderHook(() => useStudyLauncher(mockInput))

      await act(async () => {
        await result.current.startDeckStudy('deck-1', 'ordered')
      })

      expect(getStudyCards).toHaveBeenCalledWith('deck-1', {
        mode: 'ordered',
        seed: undefined,
        limit: undefined,
      })
      expect(mockInput.setDeckCards).toHaveBeenCalledWith(mockCards)
      expect(mockInput.setActiveDeckId).toHaveBeenCalledWith('deck-1')
      expect(mockInput.setSessionMode).toHaveBeenCalledWith('deck')
      expect(mockInput.setSessionKey).toHaveBeenCalledWith('deck:deck-1')
      expect(mockInput.setSessionIndex).toHaveBeenCalledWith(0)
      expect(mockInput.setIsStudying).toHaveBeenCalledWith(true)
      expect(mockInput.setLoadingDeckCards).toHaveBeenCalledWith(false)
    })

    it('должен запускать сессию в режиме random с seed', async () => {
      const mockCards = createMockCards(2)
      vi.mocked(getStudyCards).mockResolvedValue({ cards: mockCards })
      vi.setSystemTime(1000000)

      const { result } = renderHook(() => useStudyLauncher(mockInput))

      await act(async () => {
        await result.current.startDeckStudy('deck-1', 'random')
      })

      expect(getStudyCards).toHaveBeenCalledWith('deck-1', {
        mode: 'random',
        seed: 1000000 % 1_000_000_000,
        limit: undefined,
      })
    })

    it('должен нормализовать limit для режима new_random (min 1, max 200)', async () => {
      const mockCards = createMockCards(5)
      vi.mocked(getStudyCards).mockResolvedValue({ cards: mockCards })

      const { result } = renderHook(() => useStudyLauncher(mockInput))

      await act(async () => {
        await result.current.startDeckStudy('deck-1', 'new_random', 50)
      })

      expect(getStudyCards).toHaveBeenCalledWith('deck-1', {
        mode: 'new_random',
        seed: expect.any(Number),
        limit: 50,
      })
    })

    it('должен использовать limit=20 по умолчанию для новых карточек', async () => {
      const mockCards = createMockCards(3)
      vi.mocked(getStudyCards).mockResolvedValue({ cards: mockCards })

      const { result } = renderHook(() => useStudyLauncher(mockInput))

      await act(async () => {
        await result.current.startDeckStudy('deck-1', 'new_random')
      })

      expect(getStudyCards).toHaveBeenCalledWith('deck-1', {
        mode: 'new_random',
        seed: expect.any(Number),
        limit: 20,
      })
    })

    it('должен ограничивать limit снизу до 1', async () => {
      const mockCards = createMockCards(1)
      vi.mocked(getStudyCards).mockResolvedValue({ cards: mockCards })

      const { result } = renderHook(() => useStudyLauncher(mockInput))

      await act(async () => {
        await result.current.startDeckStudy('deck-1', 'new_random', 0)
      })

      const call = vi.mocked(getStudyCards).mock.calls[0]
      expect(call[1].limit).toBe(1)
    })

    it('должен ограничивать limit сверху до 200', async () => {
      const mockCards = createMockCards(10)
      vi.mocked(getStudyCards).mockResolvedValue({ cards: mockCards })

      const { result } = renderHook(() => useStudyLauncher(mockInput))

      await act(async () => {
        await result.current.startDeckStudy('deck-1', 'new_ordered', 500)
      })

      const call = vi.mocked(getStudyCards).mock.calls[0]
      expect(call[1].limit).toBe(200)
    })

    it('должен показать alert если новых карточек нет', async () => {
      vi.mocked(getStudyCards).mockResolvedValue({ cards: [] })

      const { result } = renderHook(() => useStudyLauncher(mockInput))

      await act(async () => {
        await result.current.startDeckStudy('deck-1', 'new_random', 10)
      })

      expect(global.alert).toHaveBeenCalledWith(
        'В этой колоде нет новых карточек. Все карточки уже добавлены для изучения.'
      )
      expect(mockInput.setIsStudying).not.toHaveBeenCalled()
    })

    it('должен устанавливать loading состояние', async () => {
      const mockCards = createMockCards(2)
      let resolvePromise: any
      vi.mocked(getStudyCards).mockReturnValue(
        new Promise(resolve => {
          resolvePromise = resolve
        })
      )

      const { result } = renderHook(() => useStudyLauncher(mockInput))

      act(() => {
        result.current.startDeckStudy('deck-1', 'ordered')
      })

      expect(mockInput.setLoadingDeckCards).toHaveBeenCalledWith(true)

      await act(async () => {
        resolvePromise!({ cards: mockCards })
      })

      expect(mockInput.setLoadingDeckCards).toHaveBeenCalledWith(false)
    })

    it('не должен устанавливать isStudying если карточек нет', async () => {
      vi.mocked(getStudyCards).mockResolvedValue({ cards: [] })

      const { result } = renderHook(() => useStudyLauncher(mockInput))

      await act(async () => {
        await result.current.startDeckStudy('deck-1', 'ordered')
      })

      expect(mockInput.setIsStudying).not.toHaveBeenCalled()
    })
  })

  describe('startReviewStudy', () => {
    it('должен запустить review сессию с лимитом 20', async () => {
      const mockItems = createMockCards(5)
      vi.mocked(getReviewSession).mockResolvedValue(mockItems)

      const { result } = renderHook(() => useStudyLauncher(mockInput))

      await act(async () => {
        await result.current.startReviewStudy()
      })

      expect(getReviewSession).toHaveBeenCalledWith(20)
      expect(mockInput.setDeckCards).toHaveBeenCalledWith(mockItems)
      expect(mockInput.setActiveDeckId).toHaveBeenCalledWith(null)
      expect(mockInput.setSessionMode).toHaveBeenCalledWith('review')
      expect(mockInput.setSessionKey).toHaveBeenCalledWith('review')
      expect(mockInput.setSessionIndex).toHaveBeenCalledWith(0)
      expect(mockInput.setIsStudying).toHaveBeenCalledWith(true)
    })

    it('должен устанавливать loading состояние', async () => {
      const mockItems = createMockCards(3)
      vi.mocked(getReviewSession).mockResolvedValue(mockItems)

      const { result } = renderHook(() => useStudyLauncher(mockInput))

      await act(async () => {
        await result.current.startReviewStudy()
      })

      expect(mockInput.setLoadingDeckCards).toHaveBeenCalledWith(true)
      expect(mockInput.setLoadingDeckCards).toHaveBeenLastCalledWith(false)
    })
  })

  describe('resumeDeckSession', () => {
    it('должен восстановить сохранённую сессию', () => {
      const mockSession = createMockPersistedSession({
        currentIndex: 3,
        deckCards: createMockCards(5),
      })

      const { result } = renderHook(() => useStudyLauncher(mockInput))

      act(() => {
        result.current.resumeDeckSession(mockSession)
      })

      expect(mockInput.setSessionMode).toHaveBeenCalledWith(mockSession.mode)
      expect(mockInput.setSessionKey).toHaveBeenCalledWith(mockSession.key)
      expect(mockInput.setActiveDeckId).toHaveBeenCalledWith(mockSession.activeDeckId)
      expect(mockInput.setSessionIndex).toHaveBeenCalledWith(3)
      expect(mockInput.setDeckCards).toHaveBeenCalledWith(mockSession.deckCards)
      expect(mockInput.setIsStudying).toHaveBeenCalledWith(true)
    })
  })

  describe('restartDeckSession', () => {
    it('должен очистить сессию для колоды', () => {
      const { result } = renderHook(() => useStudyLauncher(mockInput))

      act(() => {
        result.current.restartDeckSession('deck-1')
      })

      expect(clearSession).toHaveBeenCalledWith('deck:deck-1')
    })
  })
})
