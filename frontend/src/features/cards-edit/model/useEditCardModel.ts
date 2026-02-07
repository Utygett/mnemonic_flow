// src/features/cards-edit/model/useEditCardModel.ts
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/auth/AuthContext'
import { getErrorMessage } from '@/shared/lib/errors/getErrorMessage'

import type { Props, CardSummary, LevelDraft, CardsEditMode, CardSavedPayload } from './types'
import type { ApiLevelIn } from '@/entities/card'
import type { PublicDeckSummary } from '@/entities/deck'

import { isMcqType } from '../lib/cardType'
import { moveItem } from '../lib/array'
import {
  defaultMcqLevel,
  defaultQaLevel,
  getLevelIndex,
  isLevelEmpty,
  normalizeMcqLevel,
  normalizeQaLevel,
} from '../lib/levels'

import {
  loadDeckWithCards,
  updateCardTitle,
  replaceCardLevels,
  deleteCard,
  deleteDeck,
} from '../api/cardsEditApi'

export type EditCardViewModel = {
  // ui mode
  mode: CardsEditMode

  // data
  decks: PublicDeckSummary[]
  deckId: string
  setDeckId: (v: string) => void

  loading: boolean
  saving: boolean
  errorText: string | null

  cards: CardSummary[]
  selectedCardId: string
  setSelectedCardId: (v: string) => void
  selectedCard: CardSummary | null

  titleDraft: string
  setTitleDraft: (v: string) => void

  activeLevel: number
  setActiveLevel: (v: number) => void
  levels: LevelDraft[]

  qPreview: boolean
  setQPreview: (v: boolean | ((p: boolean) => boolean)) => void
  aPreview: boolean
  setAPreview: (v: boolean | ((p: boolean) => boolean)) => void

  cleanedCount: number
  canSave: boolean

  // actions
  addLevel: () => void
  removeLevel: (index: number) => void
  moveLevel: (from: number, to: number) => void

  addOption: () => void
  removeOption: (optIndex: number) => void
  patchOptionText: (optIndex: number, text: string) => void
  moveOption: (from: number, to: number) => void

  patchLevel: (index: number, patch: Partial<LevelDraft>) => void

  saveCard: () => Promise<void>
  deleteSelectedCard: () => Promise<void>
  deleteCurrentDeck: () => Promise<void>

  // for owner-only UI
  isOwnerOfCurrentDeck: boolean
  onEditDeck?: (deckId: string) => void

  // navigation
  onDone: () => void
}

export function useEditCardModel(props: Props): EditCardViewModel {
  const {
    onDone,
    onEditDeck,
    onSaved,
    initialDeckId = '',
    initialCardId = '',
    mode: modeProp,
  } = props

  const mode: CardsEditMode = modeProp ?? 'full'
  const isSessionMode = mode === 'session'

  const decks = useMemo(() => props.decks ?? [], [props.decks])

  const { currentUser } = useAuth()

  const defaultDeckId = useMemo(() => {
    if (initialDeckId) return initialDeckId
    return decks?.[0]?.deck_id ?? ''
  }, [decks, initialDeckId])

  const [deckId, setDeckIdRaw] = useState(defaultDeckId)

  const setDeckId = (v: string) => {
    if (isSessionMode) return
    setDeckIdRaw(v)
  }

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const [cards, setCards] = useState<CardSummary[]>([])
  const [selectedCardId, setSelectedCardIdRaw] = useState<string>(initialCardId || '')

  const setSelectedCardId = (v: string) => {
    if (isSessionMode) return
    setSelectedCardIdRaw(v)
  }

  const selectedCard = useMemo(
    () => cards.find(c => c.card_id === selectedCardId) || null,
    [cards, selectedCardId]
  )

  const [activeLevel, setActiveLevel] = useState(0)
  const [levels, setLevels] = useState<LevelDraft[]>([defaultQaLevel()])
  const [titleDraft, setTitleDraft] = useState('')

  const [qPreview, setQPreview] = useState(false)
  const [aPreview, setAPreview] = useState(false)

  // decks могли прийти позже (в обычном режиме)
  useEffect(() => {
    if (isSessionMode) return
    if (!deckId && defaultDeckId) setDeckIdRaw(defaultDeckId)
  }, [deckId, defaultDeckId, isSessionMode])

  // In session mode keep deckId locked to initialDeckId
  useEffect(() => {
    if (!isSessionMode) return
    if (!initialDeckId) return
    if (deckId !== initialDeckId) setDeckIdRaw(initialDeckId)
  }, [deckId, initialDeckId, isSessionMode])

  // load cards for deck
  useEffect(() => {
    if (!deckId) return
    ;(async () => {
      setLoading(true)
      setErrorText(null)
      try {
        const deck = await loadDeckWithCards(deckId)
        const deckCards = deck.cards as any as CardSummary[]
        setCards(deckCards)

        if (isSessionMode && initialCardId) {
          const exists = deckCards.some(c => String(c.card_id) === String(initialCardId))
          setSelectedCardIdRaw(exists ? String(initialCardId) : '')
        } else {
          setSelectedCardIdRaw('')
        }

        setLevels([defaultQaLevel()])
        setActiveLevel(0)
      } catch (e: unknown) {
        setErrorText(getErrorMessage(e) || 'Ошибка загрузки карточек')
        setCards([])
        setSelectedCardIdRaw('')
      } finally {
        setLoading(false)
      }
    })()
  }, [deckId, isSessionMode, initialCardId])

  // fill levels when selecting a card
  useEffect(() => {
    if (!selectedCard) return

    const sorted = [...(selectedCard.levels ?? [])].sort(
      (a, b) => getLevelIndex(a) - getLevelIndex(b)
    )

    if (isMcqType(selectedCard.type)) {
      const mapped: LevelDraft[] =
        sorted.length > 0 ? sorted.map(l => normalizeMcqLevel(l)) : [defaultMcqLevel()]
      setLevels(mapped)
    } else {
      const mapped: LevelDraft[] =
        sorted.length > 0 ? sorted.map(l => normalizeQaLevel(l)) : [defaultQaLevel()]
      setLevels(mapped)
    }

    setActiveLevel(0)
    setQPreview(false)
    setAPreview(false)
  }, [selectedCardId, selectedCard])

  // title draft
  useEffect(() => {
    const c = cards.find(x => x.card_id === selectedCardId)
    setTitleDraft(c?.title ?? '')
  }, [selectedCardId, cards])

  const patchLevel = (index: number, patch: Partial<LevelDraft>) => {
    setLevels(prev => {
      const next = [...prev]
      next[index] = { ...(next[index] as any), ...(patch as any) }
      return next
    })
  }

  const addLevel = () => {
    if (levels.length >= 10) return
    const nextLevel: LevelDraft = isMcqType(selectedCard?.type)
      ? defaultMcqLevel()
      : defaultQaLevel()
    setLevels(prev => [...prev, nextLevel])
    setActiveLevel(levels.length)
  }

  const removeLevel = (index: number) => {
    if (levels.length <= 1) return
    setLevels(prev => prev.filter((_, i) => i !== index))
    setActiveLevel(prev => {
      const nextLen = levels.length - 1
      return Math.min(prev, nextLen - 1)
    })
  }

  const moveLevel = (from: number, to: number) => {
    if (to < 0 || to >= levels.length || from === to) return

    setLevels(prev => moveItem(prev, from, to))
    setActiveLevel(prev => {
      if (prev === from) return to
      if (from < to && prev > from && prev <= to) return prev - 1
      if (to < from && prev >= to && prev < from) return prev + 1
      return prev
    })
  }

  const addOption = () => {
    setLevels(prev => {
      const next = [...prev]
      const lvl = next[activeLevel]
      if (!lvl || lvl.kind !== 'mcq') return prev
      if (lvl.options.length >= 8) return prev

      next[activeLevel] = {
        ...lvl,
        options: [...lvl.options, { id: `${Date.now()}-${Math.random()}`, text: '' }],
      }
      return next
    })
  }

  const removeOption = (optIndex: number) => {
    setLevels(prev => {
      const next = [...prev]
      const lvl = next[activeLevel]
      if (!lvl || lvl.kind !== 'mcq') return prev
      if (lvl.options.length <= 2) return prev

      const removed = lvl.options[optIndex]
      const options = lvl.options.filter((_, i) => i !== optIndex)

      next[activeLevel] = {
        ...lvl,
        options,
        correctOptionId: removed?.id === lvl.correctOptionId ? '' : lvl.correctOptionId,
      }
      return next
    })
  }

  const patchOptionText = (optIndex: number, text: string) => {
    setLevels(prev => {
      const next = [...prev]
      const lvl = next[activeLevel]
      if (!lvl || lvl.kind !== 'mcq') return prev

      const options = [...lvl.options]
      options[optIndex] = { ...options[optIndex], text }

      next[activeLevel] = { ...lvl, options }
      return next
    })
  }

  const moveOption = (from: number, to: number) => {
    setLevels(prev => {
      const next = [...prev]
      const lvl = next[activeLevel]
      if (!lvl || lvl.kind !== 'mcq') return prev
      if (to < 0 || to >= lvl.options.length || from === to) return prev

      next[activeLevel] = { ...lvl, options: moveItem(lvl.options, from, to) }
      return next
    })
  }

  const cleanedCount = useMemo(() => levels.filter(l => !isLevelEmpty(l)).length, [levels])
  const canSave = Boolean(selectedCard) && cleanedCount > 0 && !saving

  const buildApiLevels = (): ApiLevelIn[] => {
    const usable = levels.filter(l => !isLevelEmpty(l))

    return usable.map((lvl, level_index) => {
      const content =
        lvl.kind === 'qa'
          ? { question: lvl.question.trim(), answer: lvl.answer.trim() }
          : {
              question: lvl.question.trim(),
              options: lvl.options
                .map(o => ({ id: o.id, text: o.text.trim() }))
                .filter(o => o.text),
              correctOptionId: lvl.correctOptionId,
              explanation: lvl.explanation,
              timerSec: lvl.timerSec,
            }

      return {
        level_index,
        content,
        question_image_urls: (lvl as any).question_image_urls,
        answer_image_urls: (lvl as any).answer_image_urls,
        question_audio_urls: (lvl as any).question_audio_urls,
        answer_audio_urls: (lvl as any).answer_audio_urls,
      }
    })
  }

  const saveCard = async () => {
    if (!selectedCardId) return

    setSaving(true)
    setErrorText(null)

    try {
      const t = titleDraft.trim()
      if (!t) throw new Error('Название обязательно')

      await updateCardTitle(selectedCardId, t)

      const apiLevels = buildApiLevels()
      await replaceCardLevels(selectedCardId, apiLevels)

      setCards(prev => prev.map(c => (c.card_id === selectedCardId ? { ...c, title: t } : c)))

      const payload: CardSavedPayload = {
        cardId: selectedCardId,
        deckId,
        title: t,
        type: selectedCard?.type ?? '',
        levels: apiLevels,
      }
      onSaved?.(payload)

      // Call onDone after successful save
      onDone()
    } catch (e: any) {
      setErrorText(e?.message ?? 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const humanizeDeleteError = (e: any, what: 'card' | 'deck') => {
    const status = e?.status
    if (status === 403)
      return what === 'card'
        ? 'Нельзя удалить карточку: вы не хозяин.'
        : 'Нельзя удалить колоду: вы не хозяин.'
    if (status === 404) return 'Объект не найден (возможно, уже удалён).'
    return e?.message ?? 'Ошибка удаления'
  }

  const deleteSelectedCard = async () => {
    if (isSessionMode) return
    if (!selectedCard) return
    if (!window.confirm('Удалить карточку?')) return

    setSaving(true)
    setErrorText(null)
    try {
      await deleteCard(selectedCard.card_id)

      setCards(prev => prev.filter(c => c.card_id !== selectedCard.card_id))
      setSelectedCardIdRaw('')
      setLevels([defaultQaLevel()])
      setActiveLevel(0)
    } catch (e: any) {
      setErrorText(humanizeDeleteError(e, 'card'))
    } finally {
      setSaving(false)
    }
  }

  const deleteCurrentDeck = async () => {
    if (isSessionMode) return
    if (!deckId) return
    if (!window.confirm('Удалить колоду и все её карточки?')) return

    setSaving(true)
    setErrorText(null)
    try {
      await deleteDeck(deckId)

      setCards([])
      setSelectedCardIdRaw('')
      setLevels([defaultQaLevel()])
      setActiveLevel(0)

      onDone()
    } catch (e: any) {
      setErrorText(humanizeDeleteError(e, 'deck'))
    } finally {
      setSaving(false)
    }
  }

  const isOwnerOfCurrentDeck = useMemo(() => {
    const currentDeck = decks.find(d => d.deck_id === deckId)
    return Boolean(currentDeck && currentUser && currentUser.id === (currentDeck as any).owner_id)
  }, [decks, deckId, currentUser])

  return {
    mode,

    decks,
    deckId,
    setDeckId,

    loading,
    saving,
    errorText,

    cards,
    selectedCardId,
    setSelectedCardId,
    selectedCard,

    titleDraft,
    setTitleDraft,

    activeLevel,
    setActiveLevel,
    levels,

    qPreview,
    setQPreview,
    aPreview,
    setAPreview,

    cleanedCount,
    canSave,

    addLevel,
    removeLevel,
    moveLevel,

    addOption,
    removeOption,
    patchOptionText,
    moveOption,

    patchLevel,

    saveCard,
    deleteSelectedCard,
    deleteCurrentDeck,

    isOwnerOfCurrentDeck,
    onEditDeck,

    onDone,
  }
}
