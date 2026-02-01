import { describe, it, expect } from 'vitest'
import { moveItem } from './array'

describe('moveItem', () => {
  it('должен переместить элемент вперед', () => {
    const arr = ['a', 'b', 'c', 'd']
    const result = moveItem(arr, 0, 2)
    expect(result).toEqual(['b', 'c', 'a', 'd'])
  })

  it('должен переместить элемент назад', () => {
    const arr = ['a', 'b', 'c', 'd']
    const result = moveItem(arr, 3, 1)
    expect(result).toEqual(['a', 'd', 'b', 'c'])
  })

  it('не должен изменять массив при перемещении на ту же позицию', () => {
    const arr = ['a', 'b', 'c']
    const result = moveItem(arr, 1, 1)
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('должен возвращать новый массив (иммутабельность)', () => {
    const arr = ['a', 'b', 'c']
    const result = moveItem(arr, 0, 2)
    expect(result).not.toBe(arr)
    expect(arr).toEqual(['a', 'b', 'c']) // оригинал не изменился
  })
})
