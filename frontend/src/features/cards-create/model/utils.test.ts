import { describe, it, expect } from 'vitest'
import { newId, clampInt } from './utils'

describe('newId', () => {
  it('должен возвращать непустую строку', () => {
    const id = newId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('должен генерировать уникальные id', () => {
    const id1 = newId()
    const id2 = newId()
    expect(id1).not.toBe(id2)
  })

  it('должен генерировать id в hex формате', () => {
    const id = newId()
    expect(id).toMatch(/^[0-9a-f]+$/)
  })
})

describe('clampInt', () => {
  it('должен вернуть значение в пределах диапазона', () => {
    expect(clampInt(5, 0, 10)).toBe(5)
    expect(clampInt(5, 0, 10)).toBe(5)
  })

  it('должен ограничить сверху', () => {
    expect(clampInt(15, 0, 10)).toBe(10)
    expect(clampInt(100, -50, 50)).toBe(50)
  })

  it('должен ограничить снизу', () => {
    expect(clampInt(-5, 0, 10)).toBe(0)
    expect(clampInt(-100, 0, 10)).toBe(0)
  })

  it('должен округлять до целого', () => {
    expect(clampInt(5.7, 0, 10)).toBe(5)
    expect(clampInt(5.2, 0, 10)).toBe(5)
    expect(clampInt(9.9, 0, 10)).toBe(9)
  })

  it('должен возвращать min для Infinity', () => {
    expect(clampInt(Infinity, 0, 10)).toBe(0)
    expect(clampInt(-Infinity, 5, 10)).toBe(5)
  })

  it('должен возвращать min для NaN', () => {
    expect(clampInt(NaN, 0, 10)).toBe(0)
    expect(clampInt(NaN, -5, 5)).toBe(-5)
  })

  it('должен работать с отрицательными диапазонами', () => {
    expect(clampInt(0, -10, 10)).toBe(0)
    expect(clampInt(-20, -10, 10)).toBe(-10)
    expect(clampInt(20, -10, 10)).toBe(10)
  })
})
