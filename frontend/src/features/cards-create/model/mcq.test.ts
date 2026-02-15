import { describe, it, expect } from 'vitest'
import { makeDefaultMcqLevel } from './mcq'

describe('makeDefaultMcqLevel', () => {
  it('должен создать MCQ уровень с 2 опциями', () => {
    const level = makeDefaultMcqLevel()
    expect(level.question).toBe('')
    expect(level.options).toHaveLength(2)
  })

  it('должен генерировать уникальные id для опций', () => {
    const level = makeDefaultMcqLevel()
    expect(level.options[0].id).not.toBe(level.options[1].id)
  })

  it('должен устанавливать первую опцию как правильную', () => {
    const level = makeDefaultMcqLevel()
    expect(level.correctOptionId).toBe(level.options[0].id)
  })

  it('должен создавать пустые текстовые поля для опций', () => {
    const level = makeDefaultMcqLevel()
    expect(level.options[0].text).toBe('')
    expect(level.options[1].text).toBe('')
  })

  it('должен устанавливать пустые explanation и undefined timerSec', () => {
    const level = makeDefaultMcqLevel()
    expect(level.explanation).toBe('')
    expect(level.timerSec).toBeUndefined()
  })
})
