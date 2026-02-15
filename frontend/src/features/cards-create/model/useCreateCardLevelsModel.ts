// src\features\cards-create\model\useCreateCardLevelsModel.ts
import { useEffect, useMemo, useState } from 'react'

export type CardType = 'flashcard' | 'multiple_choice'

export type ImageFile = {
  file: File
  preview: string
}

export type AudioFile = {
  file: File
  preview: string
}

export type LevelQA = {
  question: string
  answer: string
  questionImageFiles: ImageFile[]
  answerImageFiles: ImageFile[]
  questionAudioFiles: AudioFile[]
  answerAudioFiles: AudioFile[]
  timerSec?: number
}

export type McqOption = {
  id: string
  text: string
  imageFile?: File
  imagePreview?: string
}

export type LevelMCQ = {
  question: string
  options: McqOption[]
  correctOptionId: string
  explanation?: string
  questionImageFiles: ImageFile[]
  answerImageFiles: ImageFile[]
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
    questionImageFiles: [],
    answerImageFiles: [],
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

  // image actions
  setLevelQuestionImage: (index: number, file: File | null) => void
  removeLevelQuestionImage: (index: number, imageIndex: number) => void
  setLevelAnswerImage: (index: number, file: File | null) => void
  removeLevelAnswerImage: (index: number, imageIndex: number) => void
  setOptionImage: (levelIndex: number, optionId: string, file: File | null) => void

  // audio actions
  setLevelQuestionAudio: (index: number, file: File | null) => void
  removeLevelQuestionAudio: (index: number, audioIndex: number) => void
  setLevelAnswerAudio: (index: number, file: File | null) => void
  removeLevelAnswerAudio: (index: number, audioIndex: number) => void

  // cleaned (готово для onSave)
  cleanedLevelsQA: Array<{ question: string; answer: string }>
  cleanedLevelsMCQ: Array<{
    question: string
    options: Array<{ id: string; text: string; image_url?: string }>
    correctOptionId: string
    explanation: string
    timerSec?: number
  }>
}

export function useCreateCardLevelsModel(cardType: CardType): CreateCardLevelsModel {
  const [activeLevel, setActiveLevel] = useState(0)

  // FLASHCARD levels
  const [levelsQA, setLevelsQA] = useState<LevelQA[]>([
    {
      question: '',
      answer: '',
      questionImageFiles: [],
      answerImageFiles: [],
      questionAudioFiles: [],
      answerAudioFiles: [],
    },
  ])
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
      setLevelsQA(prev => [
        ...prev,
        {
          question: '',
          answer: '',
          questionImageFiles: [],
          answerImageFiles: [],
          questionAudioFiles: [],
          answerAudioFiles: [],
        },
      ])
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

  const setLevelQuestionImage = (index: number, file: File | null) => {
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      if (cardType === 'flashcard') {
        setLevelsQA(current => {
          const updated = [...current]
          const lvl = updated[index]
          if (!lvl) return current

          updated[index] = {
            ...lvl,
            questionImageFiles: [
              ...lvl.questionImageFiles,
              { file, preview: reader.result as string },
            ],
          }
          return updated
        })
        return
      }

      setLevelsMCQ(current => {
        const updated = [...current]
        const lvl = updated[index]
        if (!lvl) return current

        updated[index] = {
          ...lvl,
          questionImageFiles: [
            ...(lvl.questionImageFiles ?? []),
            { file, preview: reader.result as string },
          ],
        }
        return updated
      })
    }
    reader.readAsDataURL(file)
  }

  const removeLevelQuestionImage = (index: number, imageIndex: number) => {
    if (cardType === 'flashcard') {
      setLevelsQA(current => {
        const updated = [...current]
        const lvl = updated[index]
        if (!lvl) return current

        updated[index] = {
          ...lvl,
          questionImageFiles: lvl.questionImageFiles.filter((_, i) => i !== imageIndex),
        }
        return updated
      })
      return
    }

    setLevelsMCQ(current => {
      const updated = [...current]
      const lvl = updated[index]
      if (!lvl) return current

      updated[index] = {
        ...lvl,
        questionImageFiles: (lvl.questionImageFiles ?? []).filter((_, i) => i !== imageIndex),
      }
      return updated
    })
  }

  const setLevelAnswerImage = (index: number, file: File | null) => {
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      if (cardType === 'flashcard') {
        setLevelsQA(current => {
          const updated = [...current]
          const lvl = updated[index]
          if (!lvl) return current

          updated[index] = {
            ...lvl,
            answerImageFiles: [...lvl.answerImageFiles, { file, preview: reader.result as string }],
          }
          return updated
        })
        return
      }

      setLevelsMCQ(current => {
        const updated = [...current]
        const lvl = updated[index]
        if (!lvl) return current

        updated[index] = {
          ...lvl,
          answerImageFiles: [
            ...(lvl.answerImageFiles ?? []),
            { file, preview: reader.result as string },
          ],
        }
        return updated
      })
    }
    reader.readAsDataURL(file)
  }

  const removeLevelAnswerImage = (index: number, imageIndex: number) => {
    if (cardType === 'flashcard') {
      setLevelsQA(current => {
        const updated = [...current]
        const lvl = updated[index]
        if (!lvl) return current

        updated[index] = {
          ...lvl,
          answerImageFiles: lvl.answerImageFiles.filter((_, i) => i !== imageIndex),
        }
        return updated
      })
      return
    }

    setLevelsMCQ(current => {
      const updated = [...current]
      const lvl = updated[index]
      if (!lvl) return current

      updated[index] = {
        ...lvl,
        answerImageFiles: (lvl.answerImageFiles ?? []).filter((_, i) => i !== imageIndex),
      }
      return updated
    })
  }

  const setOptionImage = (levelIndex: number, optionId: string, file: File | null) => {
    setLevelsMCQ(prev => {
      const next = [...prev]
      const lvl = next[levelIndex]
      if (!lvl) return prev

      const options = (lvl.options ?? []).map(o => {
        if (o.id !== optionId) return o

        if (file) {
          const reader = new FileReader()
          reader.onloadend = () => {
            setLevelsMCQ(current => {
              const updated = [...current]
              const updatedLevel = updated[levelIndex]
              if (!updatedLevel) return current

              const updatedOptions = (updatedLevel.options ?? []).map(opt =>
                opt.id === optionId
                  ? { ...opt, imageFile: file, imagePreview: reader.result as string }
                  : opt
              )
              updated[levelIndex] = { ...updatedLevel, options: updatedOptions }
              return updated
            })
          }
          reader.readAsDataURL(file)
        } else {
          return { ...o, imageFile: undefined, imagePreview: undefined }
        }
        return o
      })

      next[levelIndex] = { ...lvl, options }
      return prev
    })
  }

  const setLevelQuestionAudio = (index: number, file: File | null) => {
    if (!file) return

    const url = URL.createObjectURL(file)
    setLevelsQA(current => {
      const updated = [...current]
      const lvl = updated[index]
      if (!lvl) return current

      updated[index] = {
        ...lvl,
        questionAudioFiles: [...lvl.questionAudioFiles, { file, preview: url }],
      }
      return updated
    })
  }

  const removeLevelQuestionAudio = (index: number, audioIndex: number) => {
    setLevelsQA(current => {
      const updated = [...current]
      const lvl = updated[index]
      if (!lvl) return current

      // Revoke the blob URL to free memory
      const audioToRemove = lvl.questionAudioFiles[audioIndex]
      if (audioToRemove) {
        URL.revokeObjectURL(audioToRemove.preview)
      }

      updated[index] = {
        ...lvl,
        questionAudioFiles: lvl.questionAudioFiles.filter((_, i) => i !== audioIndex),
      }
      return updated
    })
  }

  const setLevelAnswerAudio = (index: number, file: File | null) => {
    if (!file) return

    const url = URL.createObjectURL(file)
    setLevelsQA(current => {
      const updated = [...current]
      const lvl = updated[index]
      if (!lvl) return current

      updated[index] = {
        ...lvl,
        answerAudioFiles: [...lvl.answerAudioFiles, { file, preview: url }],
      }
      return updated
    })
  }

  const removeLevelAnswerAudio = (index: number, audioIndex: number) => {
    setLevelsQA(current => {
      const updated = [...current]
      const lvl = updated[index]
      if (!lvl) return current

      // Revoke the blob URL to free memory
      const audioToRemove = lvl.answerAudioFiles[audioIndex]
      if (audioToRemove) {
        URL.revokeObjectURL(audioToRemove.preview)
      }

      updated[index] = {
        ...lvl,
        answerAudioFiles: lvl.answerAudioFiles.filter((_, i) => i !== audioIndex),
      }
      return updated
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
          .map(o => {
            const result: { id: string; text: string; image_url?: string } = {
              id: String(o.id),
              text: (o.text ?? '').trim(),
            }
            // Note: image_url will be filled after upload, not during creation
            // We include imageFile in the state for upload after card creation
            return result
          })
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

    setLevelQuestionImage,
    removeLevelQuestionImage,
    setLevelAnswerImage,
    removeLevelAnswerImage,
    setOptionImage,

    setLevelQuestionAudio,
    removeLevelQuestionAudio,
    setLevelAnswerAudio,
    removeLevelAnswerAudio,

    cleanedLevelsQA,
    cleanedLevelsMCQ,
  }
}
