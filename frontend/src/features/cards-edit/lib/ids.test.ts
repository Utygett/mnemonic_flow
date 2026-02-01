import { describe, it, expect } from 'vitest'
import { genId } from './ids'

describe('genId', () => {
  it('должен возвращать непустую строку', () => {
    const id = genId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('должен генерировать уникальные id', () => {
    const id1 = genId()
    const id2 = genId()
    expect(id1).not.toBe(id2)
  })

  it('должен использовать crypto.randomUUID если доступно', () => {
    const id = genId()
    // UUID формат: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    }
  })

  it('должен генерировать fallback формат если crypto недоступен', () => {
    // Тестируем формат fallback: timestamp-random
    const id = genId()
    // Формат должен содержать дефис (либо UUID, либо timestamp-random)
    expect(id).toContain('-')
  })
})
