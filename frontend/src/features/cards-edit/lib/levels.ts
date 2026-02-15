import { genId } from './ids'
import type { LevelDraft, McqLevelDraft, McqOptionDraft, QaLevelDraft } from '../model/types'

export const getLevelIndex = (l: any) => {
  if (typeof l?.level_index === 'number') return l.level_index
  if (typeof l?.levelIndex === 'number') return l.levelIndex
  if (typeof l?.level_index === 'string') return Number(l.level_index) || 0
  return 0
}

export function defaultQaLevel(): QaLevelDraft {
  return {
    kind: 'qa',
    question: '',
    answer: '',
    question_image_urls: undefined,
    answer_image_urls: undefined,
    question_audio_urls: undefined,
    answer_audio_urls: undefined,
  }
}

export function defaultMcqLevel(): McqLevelDraft {
  const a = genId()
  const b = genId()
  return {
    kind: 'mcq',
    question: '',
    options: [
      { id: a, text: '' },
      { id: b, text: '' },
    ],
    correctOptionId: '',
    explanation: '',
    timerSec: 0,
    question_image_urls: undefined,
    answer_image_urls: undefined,
    question_audio_urls: undefined,
    answer_audio_urls: undefined,
  }
}

export function isLevelEmpty(level: LevelDraft): boolean {
  if (level.kind === 'qa') {
    const q = level.question.trim()
    const a = level.answer.trim()
    return !q || !a
  }

  const q = level.question.trim()
  const opts = level.options.map(o => ({ ...o, text: o.text.trim() })).filter(o => o.text)
  const correctOk = opts.some(o => o.id === level.correctOptionId)
  return !q || opts.length < 2 || !correctOk
}

export function normalizeMcqLevel(rawLevel: any): McqLevelDraft {
  // Media URLs are at the top level, content is nested
  const c = rawLevel?.content ?? rawLevel ?? {}
  const level = rawLevel ?? {}

  const rawOptions = Array.isArray(c.options) ? c.options : []

  const options: McqOptionDraft[] =
    rawOptions.length > 0
      ? rawOptions.map((o: any) => ({
          id: String(o?.id ?? genId()),
          text: String(o?.text ?? o?.label ?? ''),
        }))
      : [
          { id: genId(), text: '' },
          { id: genId(), text: '' },
        ]

  const correctOptionId = String(c.correctOptionId ?? c.correct_option_id ?? '')

  return {
    kind: 'mcq',
    question: String(c.question ?? ''),
    options,
    correctOptionId,
    explanation: String(c.explanation ?? ''),
    timerSec: Number(c.timerSec ?? c.timer_sec ?? 0) || 0,
    // Media URLs are at the top level of the level object (arrays)
    question_image_urls: level.question_image_urls ?? level.questionImageUrls ?? undefined,
    answer_image_urls: level.answer_image_urls ?? level.answerImageUrls ?? undefined,
    question_audio_urls: level.question_audio_urls ?? level.questionAudioUrls ?? undefined,
    answer_audio_urls: level.answer_audio_urls ?? level.answerAudioUrls ?? undefined,
  }
}

export function normalizeQaLevel(rawLevel: any): QaLevelDraft {
  // Media URLs are at the top level, content is nested
  const c = rawLevel?.content ?? rawLevel ?? {}
  const level = rawLevel ?? {}

  return {
    kind: 'qa',
    question: String(c.question ?? ''),
    answer: String(c.answer ?? ''),
    // Media URLs are at the top level of the level object (arrays)
    question_image_urls: level.question_image_urls ?? level.questionImageUrls ?? undefined,
    answer_image_urls: level.answer_image_urls ?? level.answerImageUrls ?? undefined,
    question_audio_urls: level.question_audio_urls ?? level.questionAudioUrls ?? undefined,
    answer_audio_urls: level.answer_audio_urls ?? level.answerAudioUrls ?? undefined,
  }
}
