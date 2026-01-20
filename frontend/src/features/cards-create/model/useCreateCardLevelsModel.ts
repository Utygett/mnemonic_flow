import { useEffect, useMemo, useState } from 'react'

export type CardType = 'flashcard' | 'multiple_choice'

export type LevelQA = {
  question: string
  answer: string
}

export type McqOption = {
  id: string
  text: string
}

export type LevelMCQ = {
  question: string
  options: McqOption[]
  correctOptionId: string
  explanation?: string
  timerSec?: number
}

function newId(): string {
  return Math.random().toString(16).slice(2)
}

function makeDefaultMcqLevel(): LevelMCQ {
  const a = newId()
  const b = newId()
  return {
    question: '',
    options: [
      { id: a, text: '' },
      { id: b, text: '' },
    ],
    correctOptionId: a,
    explanation: '',
    timerSec: undefined,
  }
}

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.trunc(n)))
}

export type CreateCardLevelsModel = {
  activeLevel: number
  setActiveLevel: (v: number) => void

  // preview toggles
  qPreview: boolean
  setQPreview: (v: boolean) => void
  aPreview: boolean
  setAPreview: (v: boolean) => void

  mcqQPreview: boolean
  setMcqQPreview: (v: boolean) => void
  mcqOptionsPreview: boolean
  setMcqOptionsPreview: (v: boolean) => void
  mcqExplanationPreview: boolean
  setMcqExplanationPreview: (v: boolean) => void

  // raw levels state
  levelsQA: LevelQA[]
  setLevelsQA: (v: LevelQA[]) => void
  levelsMCQ: LevelMCQ[]
  setLevelsMCQ: (v: LevelMCQ[]) => void

  // derived
  levelsCount: number
  activeQA: LevelQA | undefined
  activeMCQ: LevelMCQ | undefined

  // actions
  addLevel: () => void
  removeLevel: (index: number) => void

  patchLevelQA: (index: number, patch: Partial<LevelQA>) => void
  patchLevelMCQ: (index: number, patch: Partial<LevelMCQ>) => void

  patchMcqOption: (levelIndex: number, optionId: string, patch: Partial<McqOption>) => void
  addMcqOption: (levelIndex: number) => void
  removeMcqOption: (levelIndex: number, optionId: string) => void

  // cleaned (готово для onSave)
  cleanedLevelsQA: Array<{ question: string; answer: string }>
  cleanedLevelsMCQ: Array<{
    question: string
    options: Array<{ id: string; text: string }>
    correctOptionId: string
    explanation: string
    timerSec?: number
  }>
}

export function useCreateCardLevelsModel(cardType: CardType): CreateCardLevelsModel {
  const [activeLevel, setActiveLevel] = useState(0)

  // FLASHCARD levels
  const [levelsQA, setLevelsQA] = useState<LevelQA[]>([{ question: '', answer: '' }])
  const [qPreview, setQPreview] = useState(false)
  const [aPreview, setAPreview] = useState(false)

  // MCQ levels
  const [levelsMCQ, setLevelsMCQ] = useState<LevelMCQ[]>([makeDefaultMcqLevel()])
  const [mcqQPreview, setMcqQPreview] = useState(false)
  const [mcqOptionsPreview, setMcqOptionsPreview] = useState(false)
  const [mcqExplanationPreview, setMcqExplanationPreview] = useState(false)

  const levelsCount = cardType === 'flashcard' ? levelsQA.length : levelsMCQ.length
  const activeQA = levelsQA[activeLevel]
  const activeMCQ = levelsMCQ[activeLevel]

  const addLevel = () => {
    if (levelsCount >= 10) return

    if (cardType === 'flashcard') {
      setLevelsQA(prev => [...prev, { question: '', answer: '' }])
      setActiveLevel(levelsQA.length)
    } else {
      setLevelsMCQ(prev => [...prev, makeDefaultMcqLevel()])
      setActiveLevel(levelsMCQ.length)
    }
  }

  const removeLevel = (index: number) => {
    if (levelsCount <= 1) return

    if (cardType === 'flashcard') {
      const next = levelsQA.filter((_, i) => i !== index)
      setLevelsQA(next)
      if (activeLevel >= next.length) setActiveLevel(next.length - 1)
    } else {
      const next = levelsMCQ.filter((_, i) => i !== index)
      setLevelsMCQ(next)
      if (activeLevel >= next.length) setActiveLevel(next.length - 1)
    }
  }

  const patchLevelQA = (index: number, patch: Partial<LevelQA>) => {
    setLevelsQA(prev => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const patchLevelMCQ = (index: number, patch: Partial<LevelMCQ>) => {
    setLevelsMCQ(prev => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const patchMcqOption = (levelIndex: number, optionId: string, patch: Partial<McqOption>) => {
    setLevelsMCQ(prev => {
      const next = [...prev]
      const lvl = next[levelIndex]
      if (!lvl) return prev

      const options = (lvl.options ?? []).map(o => (o.id === optionId ? { ...o, ...patch } : o))
      next[levelIndex] = { ...lvl, options }
      return next
    })
  }

  const addMcqOption = (levelIndex: number) => {
    setLevelsMCQ(prev => {
      const next = [...prev]
      const lvl = next[levelIndex]
      if (!lvl) return prev

      const optId = newId()
      const options = [...(lvl.options ?? []), { id: optId, text: '' }]

      next[levelIndex] = {
        ...lvl,
        options,
        correctOptionId: lvl.correctOptionId || optId,
      }
      return next
    })
  }

  const removeMcqOption = (levelIndex: number, optionId: string) => {
    setLevelsMCQ(prev => {
      const next = [...prev]
      const lvl = next[levelIndex]
      if (!lvl) return prev

      const options = (lvl.options ?? []).filter(o => o.id !== optionId)
      if (options.length < 2) return prev

      let correctOptionId = lvl.correctOptionId
      if (!options.some(o => o.id === correctOptionId)) {
        correctOptionId = options[0]?.id ?? ''
      }

      next[levelIndex] = { ...lvl, options, correctOptionId }
      return next
    })
  }

  const cleanedLevelsQA = useMemo(() => {
    return levelsQA
      .map(l => ({ question: l.question.trim(), answer: l.answer.trim() }))
      .filter(l => l.question && l.answer)
  }, [levelsQA])

  const cleanedLevelsMCQ = useMemo(() => {
    return levelsMCQ
      .map(l => {
        const question = (l.question ?? '').trim()
        const options = (l.options ?? [])
          .map(o => ({ id: String(o.id), text: (o.text ?? '').trim() }))
          .filter(o => o.id)

        const correctOptionId = String(l.correctOptionId ?? '')
        const explanation = (l.explanation ?? '').trim()

        const timerSec =
          typeof l.timerSec === 'number' && l.timerSec > 0
            ? clampInt(l.timerSec, 1, 3600)
            : undefined

        return { question, options, correctOptionId, explanation, timerSec }
      })
      .filter(l => {
        if (!l.question) return false
        if (l.options.length < 2) return false

        const nonEmpty = l.options.filter(o => o.text)
        if (nonEmpty.length < 2) return false

        if (!l.correctOptionId) return false
        const correct = l.options.find(o => o.id === l.correctOptionId)
        if (!correct || !correct.text) return false

        return true
      })
  }, [levelsMCQ])

  // reset при смене типа карточки (как было в CreateCard.tsx)
  useEffect(() => {
    setActiveLevel(0)
    setQPreview(false)
    setAPreview(false)
    setMcqQPreview(false)
    setMcqOptionsPreview(false)
    setMcqExplanationPreview(false)
  }, [cardType])

  return {
    activeLevel,
    setActiveLevel,

    qPreview,
    setQPreview,
    aPreview,
    setAPreview,

    mcqQPreview,
    setMcqQPreview,
    mcqOptionsPreview,
    setMcqOptionsPreview,
    mcqExplanationPreview,
    setMcqExplanationPreview,

    levelsQA,
    setLevelsQA,
    levelsMCQ,
    setLevelsMCQ,

    levelsCount,
    activeQA,
    activeMCQ,

    addLevel,
    removeLevel,

    patchLevelQA,
    patchLevelMCQ,

    patchMcqOption,
    addMcqOption,
    removeMcqOption,

    cleanedLevelsQA,
    cleanedLevelsMCQ,
  }
}
