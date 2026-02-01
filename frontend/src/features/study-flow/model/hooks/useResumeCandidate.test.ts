import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useResumeCandidate } from './useResumeCandidate'
import { createMockCards, createMockPersistedSession } from '../test/fixtures'

// Мокаем session-store
vi.mock('@/shared/lib/utils/session-store', () => ({
  loadLastSession: vi.fn(),
  saveSession: vi.fn(),
  clearSession: vi.fn(),
}))

const { loadLastSession, saveSession, clearSession } = await import(
  '@/shared/lib/utils/session-store'
)

describe('useResumeCandidate', () => {
  const mockInput = {
    isStudying: true,
    loadingDeckCards: false,
    sessionKey: 'deck:deck-1' as const,
    sessionMode: 'deck' as const,
    activeDeckId: 'deck-1',
    deckCards: createMockCards(3),
    currentIndex: 0,
    setIsStudying: vi.fn(),
    setSessionMode: vi.fn(),
    setSessionKey: vi.fn(),
    setActiveDeckId: vi.fn(),
    setSessionIndex: vi.fn(),
    setDeckCards: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // По умолчанию возвращаем null (нет сохранённой сессии)
    vi.mocked(loadLastSession).mockReturnValue(null)
  })

  describe('начальная загрузка', () => {
    it('должен загрузить последнюю сессию при mount', () => {
      const mockSession = createMockPersistedSession()
      vi.mocked(loadLastSession).mockReturnValue(mockSession)

      renderHook(() => useResumeCandidate(mockInput))

      expect(loadLastSession).toHaveBeenCalled()
    })

    it('должен установить resumeCandidate если сессия активна', () => {
      const mockSession = createMockPersistedSession({ isStudying: true })
      vi.mocked(loadLastSession).mockReturnValue(mockSession)

      const { result } = renderHook(() => useResumeCandidate(mockInput))

      expect(result.current.resumeCandidate).toEqual(mockSession)
    })

    it('не должен установить resumeCandidate если isStudying=false в сохранённой сессии', () => {
      const mockSession = createMockPersistedSession({ isStudying: false })
      vi.mocked(loadLastSession).mockReturnValue(mockSession)

      // Создаём input с isStudying=false, чтобы не вызывать автосохранение
      const inputWithNotStudying = { ...mockInput, isStudying: false }

      const { result } = renderHook(() => useResumeCandidate(inputWithNotStudying))

      expect(result.current.resumeCandidate).toBeNull()
    })

    it('должен установить resumeCandidate в null если сессия отсутствует', () => {
      vi.mocked(loadLastSession).mockReturnValue(null)

      const { result } = renderHook(() => useResumeCandidate(mockInput))

      expect(result.current.resumeCandidate).toBeNull()
    })
  })

  describe('автосохранение', () => {
    it('должен сохранять сессию при изменении зависимостей', () => {
      renderHook(() => useResumeCandidate(mockInput))

      expect(saveSession).toHaveBeenCalledWith({
        key: 'deck:deck-1',
        mode: 'deck',
        activeDeckId: 'deck-1',
        deckCards: mockInput.deckCards,
        currentIndex: 0,
        isStudying: true,
        savedAt: expect.any(Number),
      })
    })

    it('не должен сохранять если isStudying=false', () => {
      const input = { ...mockInput, isStudying: false }

      renderHook(() => useResumeCandidate(input))

      expect(saveSession).not.toHaveBeenCalled()
    })

    it('не должен сохранять если loadingDeckCards=true', () => {
      const input = { ...mockInput, loadingDeckCards: true }

      renderHook(() => useResumeCandidate(input))

      expect(saveSession).not.toHaveBeenCalled()
    })

    it('не должен сохранять если deckCards пустой', () => {
      const input = { ...mockInput, deckCards: [] }

      renderHook(() => useResumeCandidate(input))

      expect(saveSession).not.toHaveBeenCalled()
    })
  })

  describe('resumeLastSession', () => {
    it('должен восстановить состояние из resumeCandidate', () => {
      const mockSession = createMockPersistedSession({
        currentIndex: 2,
        deckCards: createMockCards(5),
      })
      vi.mocked(loadLastSession).mockReturnValue(mockSession)

      const { result } = renderHook(() => useResumeCandidate(mockInput))

      act(() => {
        result.current.resumeLastSession()
      })

      expect(mockInput.setSessionMode).toHaveBeenCalledWith(mockSession.mode)
      expect(mockInput.setSessionKey).toHaveBeenCalledWith(mockSession.key)
      expect(mockInput.setActiveDeckId).toHaveBeenCalledWith(mockSession.activeDeckId)
      expect(mockInput.setSessionIndex).toHaveBeenCalledWith(2)
      expect(mockInput.setDeckCards).toHaveBeenCalledWith(mockSession.deckCards)
      expect(mockInput.setIsStudying).toHaveBeenCalledWith(true)
    })

    it('не должен делать ничего если resumeCandidate отсутствует', () => {
      vi.mocked(loadLastSession).mockReturnValue(null)

      const { result } = renderHook(() => useResumeCandidate(mockInput))

      act(() => {
        result.current.resumeLastSession()
      })

      expect(mockInput.setSessionMode).not.toHaveBeenCalled()
    })

    it('должен очистить resumeCandidate после восстановления', () => {
      const mockSession = createMockPersistedSession()
      vi.mocked(loadLastSession).mockReturnValue(mockSession)

      const { result } = renderHook(() => useResumeCandidate(mockInput))

      expect(result.current.resumeCandidate).not.toBeNull()

      act(() => {
        result.current.resumeLastSession()
      })

      expect(result.current.resumeCandidate).toBeNull()
    })
  })

  describe('discardResume', () => {
    it('должен очистить сессию и resumeCandidate', () => {
      const mockSession = createMockPersistedSession()
      vi.mocked(loadLastSession).mockReturnValue(mockSession)

      const { result } = renderHook(() => useResumeCandidate(mockInput))

      act(() => {
        result.current.discardResume()
      })

      expect(clearSession).toHaveBeenCalledWith(mockSession.key)
      expect(result.current.resumeCandidate).toBeNull()
    })

    it('не должен делать ничего если resumeCandidate отсутствует', () => {
      vi.mocked(loadLastSession).mockReturnValue(null)

      const { result } = renderHook(() => useResumeCandidate(mockInput))

      act(() => {
        result.current.discardResume()
      })

      expect(clearSession).not.toHaveBeenCalled()
    })
  })

  describe('setResumeCandidate', () => {
    it('должен позволять устанавливать resumeCandidate извне', () => {
      const { result } = renderHook(() => useResumeCandidate(mockInput))

      const newSession = createMockPersistedSession()

      act(() => {
        result.current.setResumeCandidate(newSession)
      })

      expect(result.current.resumeCandidate).toEqual(newSession)
    })
  })
})
