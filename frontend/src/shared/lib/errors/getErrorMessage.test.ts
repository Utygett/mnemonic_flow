import { describe, it, expect } from 'vitest'
import { getErrorMessage } from './getErrorMessage'

describe('getErrorMessage', () => {
  describe('пустые значения', () => {
    it('должен вернуть пустую строку для null', () => {
      expect(getErrorMessage(null)).toBe('')
    })

    it('должен вернуть пустую строку для undefined', () => {
      expect(getErrorMessage(undefined)).toBe('')
    })

    it('должен вернуть пустую строку для 0', () => {
      expect(getErrorMessage(0)).toBe('')
    })

    it('должен вернуть пустую строку для false', () => {
      expect(getErrorMessage(false)).toBe('')
    })
  })

  describe('строки', () => {
    it('должен вернуть строку как есть', () => {
      expect(getErrorMessage('Ошибка сети')).toBe('Ошибка сети')
    })
  })

  describe('Error объекты', () => {
    it('должен вернуть message из Error', () => {
      const err = new Error('Что-то пошло не так')
      expect(getErrorMessage(err)).toBe('Что-то пошло не так')
    })

    it('должен вернуть detail если есть (приоритет над message)', () => {
      const err = new Error('message')
      ;(err as any).detail = 'Детальное описание ошибки'
      expect(getErrorMessage(err)).toBe('Детальное описание ошибки')
    })
  })

  describe('произвольные объекты', () => {
    it('должен вернуть detail из объекта', () => {
      const obj = { detail: 'error detail' }
      expect(getErrorMessage(obj)).toBe('error detail')
    })

    it('должен вернуть message из объекта', () => {
      const obj = { message: 'error message' }
      expect(getErrorMessage(obj)).toBe('error message')
    })

    it('должен предпочитать detail над message', () => {
      const obj = { message: 'msg', detail: 'det' }
      expect(getErrorMessage(obj)).toBe('det')
    })

    it('должен сериализовать объект в JSON', () => {
      const obj = { code: 500, text: 'Server error' }
      expect(getErrorMessage(obj)).toBe('{"code":500,"text":"Server error"}')
    })
  })

  describe('примитивные типы', () => {
    it('должен вернуть строку для числа', () => {
      expect(getErrorMessage(404)).toBe('404')
    })

    it('должен вернуть строку для boolean', () => {
      expect(getErrorMessage(true)).toBe('true')
    })
  })
})
