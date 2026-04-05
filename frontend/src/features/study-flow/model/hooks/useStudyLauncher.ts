import { useCallback } from 'react'

import { getReviewSession, getStudyCards } from '@/entities/card'
import type { StudyCard, StudyMode } from '@/entities/card'

import { toStudyCards } from '@/shared/lib/utils/toStudyCards'
import { clearSession, type PersistedSession } from '@/shared/lib/utils/session-store'

type Input = {
  setLoadingDeckCards: (v: boolean) => void
  setDeckCards: (v: StudyCard[]) => void
  setActiveDeckId: (v: string | null) => void
  setShowCardTitle: (v: boolean) => void

  setIsStudying: (v: boolean) => void

  setSessionMode: (v: 'deck' | 'review') => void
  setSessionKey: (v: 'review' | `deck:${string}`) => void
  setSessionIndex: (v: number) => void
}

/** Map raw API response (camelCase or snake_case) to StudyCard. */
function mapRawCards(cards: any[]): StudyCard[] {
  return cards.map((c: any) => ({
    id: c.id ?? c.card_id,
    deckId: c.deckId ?? c.deck_id,
    title: c.title,
    type: c.type,
    levels: (c.levels ?? []).map((l: any) => ({
      levelindex: l.levelIndex ?? l.levelindex ?? l.level_index,
      content: l.content,
      questionImageUrls: l.questionImageUrls ?? l.question_image_urls ?? [],
      answerImageUrls: l.answerImageUrls ?? l.answer_image_urls ?? [],
      questionAudioUrls: l.questionAudioUrls ?? l.question_audio_urls ?? [],
      answerAudioUrls: l.answerAudioUrls ?? l.answer_audio_urls ?? [],
    })),
    activeLevel: c.activeLevel ?? c.active_level ?? 0,
    activeCardLevelId: c.activeCardLevelId ?? c.card_level_id ?? c.active_card_level_id ?? '',
    reviewHistory: c.reviewHistory ?? c.review_history ?? [],
  }))
}

export function useStudyLauncher(input: Input) {
  const startDeckStudy = useCallback(
    async (deckId: string, mode: StudyMode, limit?: number) => {
      const key = `deck:${deckId}` as const

      const seed =
        mode === 'random' || mode === 'new_random' ? Date.now() % 1_000_000_000 : undefined

      const limitNormalized =
        mode === 'new_random' || mode === 'new_ordered'
          ? Math.max(
              1,
              Math.min(200, Math.trunc(Number.isFinite(Number(limit)) ? Number(limit) : 20))
            )
          : undefined

      try {
        input.setLoadingDeckCards(true)

        const res = await getStudyCards(deckId, {
          mode,
          seed,
          limit: limitNormalized,
        })

        // Проверка: если выбраны "новые карточки", а бэкенд вернул пустой массив
        if ((mode === 'new_random' || mode === 'new_ordered') && res.cards.length === 0) {
          alert('В этой колоде нет новых карточек. Все карточки уже добавлены для изучения.')
          return // Не запускаем сессию
        }

        // Normalize: API may return camelCase or snake_case fields, map to StudyCard
        input.setDeckCards(mapRawCards(res.cards as any[]))
        input.setActiveDeckId(deckId)
        input.setShowCardTitle(res.deck.show_card_title)
        input.setSessionMode('deck')
        input.setSessionKey(key)
        input.setSessionIndex(0)

        if (res.cards.length > 0) input.setIsStudying(true)
      } finally {
        input.setLoadingDeckCards(false)
      }
    },
    [input]
  )

  const startReviewStudy = useCallback(async () => {
    try {
      input.setLoadingDeckCards(true)

      const rawItems = await getReviewSession(200)
      // Группируем карточки по колодам: все карточки одной колоды идут подряд
      const sorted = [...(rawItems as any[])].sort((a, b) =>
        (a.deck_id ?? '').localeCompare(b.deck_id ?? '')
      )
      input.setDeckCards(toStudyCards(sorted))
      input.setActiveDeckId(null)
      input.setShowCardTitle(false)

      input.setIsStudying(true)
      input.setSessionMode('review')
      input.setSessionKey('review')
      input.setSessionIndex(0)
    } finally {
      input.setLoadingDeckCards(false)
    }
  }, [input])

  const resumeDeckSession = useCallback(
    (saved: PersistedSession) => {
      input.setSessionMode(saved.mode)
      input.setSessionKey(saved.key)
      input.setActiveDeckId(saved.activeDeckId)
      input.setSessionIndex(saved.currentIndex ?? 0)
      input.setDeckCards(saved.deckCards ?? [])
      input.setIsStudying(true)
    },
    [input]
  )

  const restartDeckSession = useCallback((deckId: string) => {
    clearSession(`deck:${deckId}` as const)
  }, [])

  return { startDeckStudy, startReviewStudy, resumeDeckSession, restartDeckSession }
}
