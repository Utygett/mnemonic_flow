import { describe, it, expect } from 'vitest'
import { isMcqType } from './cardType'

describe('isMcqType', () => {
  it('должен вернуть true для "mcq"', () => {
    expect(isMcqType('mcq')).toBe(true)
  })

  it('должен вернуть true для "MCQ" (case-insensitive)', () => {
    expect(isMcqType('MCQ')).toBe(true)
  })

  it('должен вернуть true для "multiple_choice"', () => {
    expect(isMcqType('multiple_choice')).toBe(true)
  })

  it('должен вернуть true для "multiple-choice"', () => {
    expect(isMcqType('multiple-choice')).toBe(true)
  })

  it('должен вернуть true для типа содержащего "choice"', () => {
    expect(isMcqType('my_choice_type')).toBe(true)
  })

  it('должен вернуть false для "flashcard"', () => {
    expect(isMcqType('flashcard')).toBe(false)
  })

  it('должен вернуть false для "basic"', () => {
    expect(isMcqType('basic')).toBe(false)
  })

  it('должен вернуть false для undefined', () => {
    expect(isMcqType(undefined)).toBe(false)
  })

  it('должен вернуть false для пустой строки', () => {
    expect(isMcqType('')).toBe(false)
  })
})
