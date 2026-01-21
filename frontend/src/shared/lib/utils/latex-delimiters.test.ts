import { describe, it, expect } from 'vitest'
import { convertBracketLatexToDollar } from './latex-delimiters'

describe('convertBracketLatexToDollar', () => {
  it('должен возвращать пустую строку как есть', () => {
    expect(convertBracketLatexToDollar('')).toBe('')
  })

  it('должен возвращать undefined как есть', () => {
    expect(convertBracketLatexToDollar(undefined as any)).toBeUndefined()
  })

  it('должен конвертировать блочные формулы \\[ ... \\] в $$ ... $$', () => {
    const result = convertBracketLatexToDollar('Text \\[ x^2 \\] more')
    expect(result).toBe('Text $$\nx^2\n$$ more')
  })

  it('должен конвертировать инлайн-формулы \\( ... \\) в $...$', () => {
    const result = convertBracketLatexToDollar('Text \\( x^2 \\) more')
    expect(result).toBe('Text $x^2$ more')
  })

  it('должен обрабатывать несколько формул в строке', () => {
    const result = convertBracketLatexToDollar('\\( a \\) and \\( b \\)')
    expect(result).toBe('$a$ and $b$')
  })

  it('должен обрабатывать смешанные блочные и инлайн формулы', () => {
    const result = convertBracketLatexToDollar('Inline \\( x \\) and block \\[ y \\] end')
    expect(result).toBe('Inline $x$ and block $$\ny\n$$ end')
  })

  it('не должен изменять текст без LaTeX', () => {
    const result = convertBracketLatexToDollar('Just plain text')
    expect(result).toBe('Just plain text')
  })

  it('должен обрабатывать многострочные блочные формулы (флаг s)', () => {
    const result = convertBracketLatexToDollar('\\[\nline1\nline2\n\\]')
    expect(result).toBe('$$\nline1\nline2\n$$')
  })

  it('должен сохранять содержимое формул', () => {
    const result = convertBracketLatexToDollar('\\( \\sum_{i=1}^{n} x_i \\)')
    expect(result).toBe('$\\sum_{i=1}^{n} x_i$')
  })
})
