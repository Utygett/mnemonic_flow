import { describe, it, expect } from 'vitest'
import { parseCsvNameFrontBack } from './csv'

describe('parseCsvNameFrontBack', () => {
  describe('пустой CSV', () => {
    it('должен вернуть ошибку для пустой строки', () => {
      const result = parseCsvNameFrontBack('')
      expect(result.rows).toEqual([])
      expect(result.errors).toEqual(['CSV пустой'])
      expect(result.total).toBe(0)
    })
  })

  describe('CSV без заголовка', () => {
    it('должен распарсить простую строку с 3 колонками', () => {
      const result = parseCsvNameFrontBack('Card1,Front text,Back text')
      expect(result.rows).toEqual([{ name: 'Card1', front: 'Front text', back: 'Back text' }])
      expect(result.errors).toEqual([])
      expect(result.total).toBe(1)
    })

    it('должен распарсить несколько строк', () => {
      const csv = `Card1,Front1,Back1
Card2,Front2,Back2
Card3,Front3,Back3`
      const result = parseCsvNameFrontBack(csv)
      expect(result.rows).toEqual([
        { name: 'Card1', front: 'Front1', back: 'Back1' },
        { name: 'Card2', front: 'Front2', back: 'Back2' },
        { name: 'Card3', front: 'Front3', back: 'Back3' },
      ])
      expect(result.errors).toEqual([])
      expect(result.total).toBe(3)
    })

    it('должен обрабатывать пробелы вокруг значений', () => {
      const result = parseCsvNameFrontBack('  Card1  ,  Front  ,  Back  ')
      expect(result.rows).toEqual([{ name: 'Card1', front: 'Front', back: 'Back' }])
      expect(result.errors).toEqual([])
    })

    it('должен вернуть ошибку если не 3 колонки', () => {
      const result = parseCsvNameFrontBack('Card1,Front')
      expect(result.rows).toEqual([])
      expect(result.errors).toEqual(['CSV должен быть 3 колонки: name,front,back'])
      expect(result.total).toBe(0)
    })
  })

  describe('CSV с заголовком', () => {
    it('должен распознать заголовок с name, front, back', () => {
      const csv = `name,front,back
Card1,Front1,Back1`
      const result = parseCsvNameFrontBack(csv)
      expect(result.rows).toEqual([{ name: 'Card1', front: 'Front1', back: 'Back1' }])
      expect(result.errors).toEqual([])
      expect(result.total).toBe(1)
    })

    it('должен работать с заголовком в другом порядке', () => {
      const csv = `front,name,back
Front1,Card1,Back1`
      const result = parseCsvNameFrontBack(csv)
      expect(result.rows).toEqual([{ name: 'Card1', front: 'Front1', back: 'Back1' }])
      expect(result.errors).toEqual([])
      expect(result.total).toBe(1)
    })

    it('должен быть case-insensitive для заголовка', () => {
      const csv = `NAME,FRONT,BACK
Card1,Front1,Back1`
      const result = parseCsvNameFrontBack(csv)
      expect(result.rows).toEqual([{ name: 'Card1', front: 'Front1', back: 'Back1' }])
      expect(result.errors).toEqual([])
    })

    it('должен распознать заголовок с дополнительными колонками', () => {
      const csv = `extra,name,more,front,back,other
x,Card1,y,Front1,Back1,z`
      const result = parseCsvNameFrontBack(csv)
      expect(result.rows).toEqual([{ name: 'Card1', front: 'Front1', back: 'Back1' }])
      expect(result.errors).toEqual([])
    })
  })

  describe('пустые поля', () => {
    it('должен добавить ошибку для строки с пустым name', () => {
      const csv = `name,front,back
,Front1,Back1`
      const result = parseCsvNameFrontBack(csv)
      expect(result.rows).toEqual([])
      expect(result.errors).toEqual(['2: пустые поля name/front/back'])
      expect(result.total).toBe(1)
    })

    it('должен пропускать строки с ошибками и продолжать парсинг', () => {
      const csv = `name,front,back
Card1,Front1,Back1
,Front2,Back2
Card3,Front3,Back3`
      const result = parseCsvNameFrontBack(csv)
      expect(result.rows).toEqual([
        { name: 'Card1', front: 'Front1', back: 'Back1' },
        { name: 'Card3', front: 'Front3', back: 'Back3' },
      ])
      expect(result.errors).toEqual(['3: пустые поля name/front/back'])
      expect(result.total).toBe(3)
    })

    it('должен собирать несколько ошибок', () => {
      const csv = `name,front,back
,Front1,Back1
Card2,,Back2
Card3,Front3,`
      const result = parseCsvNameFrontBack(csv)
      expect(result.rows).toEqual([])
      expect(result.errors).toEqual([
        '2: пустые поля name/front/back',
        '3: пустые поля name/front/back',
        '4: пустые поля name/front/back',
      ])
      expect(result.total).toBe(3)
    })
  })

  describe('кавычки и спецсимволы', () => {
    it('должен обрабатывать значения в кавычках', () => {
      const csv = `name,front,back
"Card 1","Front, with comma","Back text"`
      const result = parseCsvNameFrontBack(csv)
      expect(result.rows).toEqual([
        { name: 'Card 1', front: 'Front, with comma', back: 'Back text' },
      ])
      expect(result.errors).toEqual([])
    })

    it('должен обрабатывать удвоенные кавычки внутри значения', () => {
      const csv = `name,front,back
Card1,"Front ""quoted"" text",Back1`
      const result = parseCsvNameFrontBack(csv)
      expect(result.rows).toEqual([{ name: 'Card1', front: 'Front "quoted" text', back: 'Back1' }])
      expect(result.errors).toEqual([])
    })

    it('должен обрабатывать запятые в кавычках', () => {
      const csv = `name,front,back
Card1,"Front, with, multiple, commas",Back1`
      const result = parseCsvNameFrontBack(csv)
      expect(result.rows).toEqual([
        { name: 'Card1', front: 'Front, with, multiple, commas', back: 'Back1' },
      ])
      expect(result.errors).toEqual([])
    })
  })

  describe('специальные символы в значениях', () => {
    it('должен обрабатывать Unicode символы', () => {
      const csv = `name,front,back
Карточка,Вопрос,Ответ 📚`
      const result = parseCsvNameFrontBack(csv)
      expect(result.rows).toEqual([{ name: 'Карточка', front: 'Вопрос', back: 'Ответ 📚' }])
      expect(result.errors).toEqual([])
    })

    it('должен обрабатывать LaTeX формулы', () => {
      const csv = `name,front,back
Formula,What is $\\sum_{i=1}^{n} x_i$?,The sum of all $x_i$`
      const result = parseCsvNameFrontBack(csv)
      expect(result.rows).toEqual([
        {
          name: 'Formula',
          front: 'What is $\\sum_{i=1}^{n} x_i$?',
          back: 'The sum of all $x_i$',
        },
      ])
      expect(result.errors).toEqual([])
    })
  })

  describe('total счётчик', () => {
    it('должен считать общее количество строк данных', () => {
      const csv = `name,front,back
Card1,Front1,Back1
,Front2,Back2
Card3,Front3,Back3
Card4,Front4,Back4`
      const result = parseCsvNameFrontBack(csv)
      expect(result.total).toBe(4)
      expect(result.rows).toHaveLength(3)
      expect(result.errors).toEqual(['3: пустые поля name/front/back'])
    })

    it('должен показывать total = 0 для CSV с неверным форматом', () => {
      const result = parseCsvNameFrontBack('only,two,columns,here,wrong')
      expect(result.total).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('должен игнорировать пустые строки в конце', () => {
      const csv = `Card1,Front1,Back1


`
      const result = parseCsvNameFrontBack(csv)
      expect(result.rows).toEqual([{ name: 'Card1', front: 'Front1', back: 'Back1' }])
      expect(result.total).toBe(1)
    })
  })
})
