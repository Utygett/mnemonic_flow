import { describe, it, expect } from 'vitest'
import {
  getLevelIndex,
  defaultQaLevel,
  defaultMcqLevel,
  isLevelEmpty,
  normalizeMcqLevel,
  normalizeQaLevel,
} from './levels'
import type { QaLevelDraft, McqLevelDraft } from '../model/types'

describe('getLevelIndex', () => {
  it('должен вернуть level_index как число', () => {
    expect(getLevelIndex({ level_index: 5 })).toBe(5)
  })

  it('должен вернуть levelIndex (camelCase)', () => {
    expect(getLevelIndex({ levelIndex: 3 })).toBe(3)
  })

  it('должен конвертировать level_index из строки в число', () => {
    expect(getLevelIndex({ level_index: '7' })).toBe(7)
  })

  it('должен вернуть 0 для невалидной строки', () => {
    expect(getLevelIndex({ level_index: 'abc' })).toBe(0)
  })

  it('должен вернуть 0 если индекс отсутствует', () => {
    expect(getLevelIndex({})).toBe(0)
  })
})

describe('defaultQaLevel', () => {
  it('должен создать QA уровень с пустыми полями', () => {
    const level = defaultQaLevel()
    expect(level).toEqual({
      kind: 'qa',
      question: '',
      answer: '',
      question_image_urls: undefined,
      answer_image_urls: undefined,
      question_audio_urls: undefined,
      answer_audio_urls: undefined,
    })
  })
})

describe('defaultMcqLevel', () => {
  it('должен создать MCQ уровень с 2 пустыми опциями', () => {
    const level = defaultMcqLevel()
    expect(level.kind).toBe('mcq')
    expect(level.question).toBe('')
    expect(level.options).toHaveLength(2)
    expect(level.options[0].text).toBe('')
    expect(level.options[1].text).toBe('')
    expect(level.correctOptionId).toBe('')
    expect(level.explanation).toBe('')
    expect(level.timerSec).toBe(0)
  })

  it('должен генерировать уникальные id для опций', () => {
    const level = defaultMcqLevel()
    expect(level.options[0].id).not.toBe(level.options[1].id)
  })
})

describe('isLevelEmpty', () => {
  describe('QA уровень', () => {
    it('должен вернуть true для пустого вопроса', () => {
      const level: QaLevelDraft = { kind: 'qa', question: '', answer: 'answer' }
      expect(isLevelEmpty(level)).toBe(true)
    })

    it('должен вернуть true для пустого ответа', () => {
      const level: QaLevelDraft = { kind: 'qa', question: 'question', answer: '' }
      expect(isLevelEmpty(level)).toBe(true)
    })

    it('должен вернуть true для вопроса с только пробелами', () => {
      const level: QaLevelDraft = { kind: 'qa', question: '   ', answer: 'answer' }
      expect(isLevelEmpty(level)).toBe(true)
    })

    it('должен вернуть false если оба поля заполнены', () => {
      const level: QaLevelDraft = { kind: 'qa', question: 'Q?', answer: 'A' }
      expect(isLevelEmpty(level)).toBe(false)
    })
  })

  describe('MCQ уровень', () => {
    it('должен вернуть true для пустого вопроса', () => {
      const level: McqLevelDraft = {
        kind: 'mcq',
        question: '',
        options: [
          { id: '1', text: 'opt1' },
          { id: '2', text: 'opt2' },
        ],
        correctOptionId: '1',
        explanation: '',
        timerSec: 0,
      }
      expect(isLevelEmpty(level)).toBe(true)
    })

    it('должен вернуть true если меньше 2 опций с текстом', () => {
      const level: McqLevelDraft = {
        kind: 'mcq',
        question: 'Q?',
        options: [
          { id: '1', text: 'only one' },
          { id: '2', text: '' },
        ],
        correctOptionId: '1',
        explanation: '',
        timerSec: 0,
      }
      expect(isLevelEmpty(level)).toBe(true)
    })

    it('должен вернуть true если correctOptionId не совпадает ни с одной опцией', () => {
      const level: McqLevelDraft = {
        kind: 'mcq',
        question: 'Q?',
        options: [
          { id: '1', text: 'opt1' },
          { id: '2', text: 'opt2' },
        ],
        correctOptionId: '999',
        explanation: '',
        timerSec: 0,
      }
      expect(isLevelEmpty(level)).toBe(true)
    })

    it('должен вернуть false для валидного MCQ уровня', () => {
      const level: McqLevelDraft = {
        kind: 'mcq',
        question: 'Q?',
        options: [
          { id: '1', text: 'opt1' },
          { id: '2', text: 'opt2' },
        ],
        correctOptionId: '1',
        explanation: '',
        timerSec: 0,
      }
      expect(isLevelEmpty(level)).toBe(false)
    })
  })
})

describe('normalizeMcqLevel', () => {
  it('должен нормализовать MCQ уровень с полными данными', () => {
    const raw = {
      question: 'Q?',
      options: [
        { id: '1', text: 'opt1' },
        { id: '2', text: 'opt2' },
      ],
      correctOptionId: '1',
      explanation: 'expl',
      timerSec: 30,
    }
    const result = normalizeMcqLevel(raw)
    expect(result.kind).toBe('mcq')
    expect(result.question).toBe('Q?')
    expect(result.options).toHaveLength(2)
    expect(result.correctOptionId).toBe('1')
    expect(result.explanation).toBe('expl')
    expect(result.timerSec).toBe(30)
  })

  it('должен создать 2 пустые опции если options отсутствуют', () => {
    const result = normalizeMcqLevel({})
    expect(result.options).toHaveLength(2)
    expect(result.options[0].text).toBe('')
    expect(result.options[1].text).toBe('')
  })

  it('должен конвертировать snake_case поля в camelCase', () => {
    const raw = {
      correct_option_id: '123',
      timer_sec: 45,
    }
    const result = normalizeMcqLevel(raw)
    expect(result.correctOptionId).toBe('123')
    expect(result.timerSec).toBe(45)
  })

  it('должен генерировать id для опций если отсутствует', () => {
    const raw = {
      options: [{ text: 'opt1' }, { text: 'opt2' }],
    }
    const result = normalizeMcqLevel(raw)
    expect(result.options[0].id).toBeTruthy()
    expect(result.options[1].id).toBeTruthy()
  })

  it('должен использовать label как text если отсутствует', () => {
    const raw = {
      options: [{ label: 'opt1' }, { label: 'opt2' }],
    }
    const result = normalizeMcqLevel(raw)
    expect(result.options[0].text).toBe('opt1')
    expect(result.options[1].text).toBe('opt2')
  })

  it('должен обрабатывать null/undefined входные данные', () => {
    const result = normalizeMcqLevel(null)
    expect(result.kind).toBe('mcq')
    expect(result.question).toBe('')
    expect(result.options).toHaveLength(2)
  })

  it('должен сохранять media URL из исходных данных', () => {
    const raw = {
      question: 'Q?',
      options: [{ id: '1', text: 'opt1' }],
      correctOptionId: '1',
      question_image_urls: ['/images/q.jpg'],
      answer_audio_urls: ['/audio/a.mp3'],
    }
    const result = normalizeMcqLevel(raw)
    expect(result.question_image_urls).toEqual(['/images/q.jpg'])
    expect(result.answer_audio_urls).toEqual(['/audio/a.mp3'])
  })
})

describe('normalizeQaLevel', () => {
  it('должен нормализовать QA уровень с полными данными', () => {
    const raw = { question: 'Q?', answer: 'A' }
    const result = normalizeQaLevel(raw)
    expect(result).toEqual({
      kind: 'qa',
      question: 'Q?',
      answer: 'A',
      question_image_urls: undefined,
      answer_image_urls: undefined,
      question_audio_urls: undefined,
      answer_audio_urls: undefined,
    })
  })

  it('должен сохранять media URL из исходных данных', () => {
    const raw = {
      question: 'Q?',
      answer: 'A',
      question_image_urls: ['/images/q.jpg'],
      answer_audio_urls: ['/audio/a.mp3'],
    }
    const result = normalizeQaLevel(raw)
    expect(result.question_image_urls).toEqual(['/images/q.jpg'])
    expect(result.answer_audio_urls).toEqual(['/audio/a.mp3'])
  })

  it('должен использовать пустые строки если поля отсутствуют', () => {
    const result = normalizeQaLevel({})
    expect(result).toEqual({
      kind: 'qa',
      question: '',
      answer: '',
      question_image_urls: undefined,
      answer_image_urls: undefined,
      question_audio_urls: undefined,
      answer_audio_urls: undefined,
    })
  })

  it('должен обрабатывать null/undefined входные данные', () => {
    const result = normalizeQaLevel(null)
    expect(result).toEqual({
      kind: 'qa',
      question: '',
      answer: '',
      question_image_urls: undefined,
      answer_image_urls: undefined,
      question_audio_urls: undefined,
      answer_audio_urls: undefined,
    })
  })
})
