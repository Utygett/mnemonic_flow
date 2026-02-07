import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RatingButton } from './RatingButton'

describe('RatingButton', () => {
  describe('рендеринг', () => {
    it('должен отображать переданный label', () => {
      render(<RatingButton rating="good" label="Хорошо" onClick={vi.fn()} />)
      expect(screen.getByText('Хорошо')).toBeInTheDocument()
    })

    it('должен отображать интервал, если он передан', () => {
      render(
        <RatingButton rating="good" label="Хорошо" intervalSeconds={600} onClick={vi.fn()} />
      )
      expect(screen.getByText('через 10 мин')).toBeInTheDocument()
    })

    it('должен иметь правильный цвет для "again" (красный)', () => {
      const { container } = render(<RatingButton rating="again" label="Снова" onClick={vi.fn()} />)
      const button = container.querySelector('button') as HTMLButtonElement
      expect(button.style.background).toBe('#ef4444')
    })

    it('должен иметь правильный цвет для "hard" (оранжевый)', () => {
      const { container } = render(<RatingButton rating="hard" label="Трудно" onClick={vi.fn()} />)
      const button = container.querySelector('button') as HTMLButtonElement
      expect(button.style.background).toBe('#f97316')
    })

    it('должен иметь правильный цвет для "good" (зелёный)', () => {
      const { container } = render(<RatingButton rating="good" label="Хорошо" onClick={vi.fn()} />)
      const button = container.querySelector('button') as HTMLButtonElement
      expect(button.style.background).toBe('#22c55e')
    })

    it('должен иметь правильный цвет для "easy" (синий)', () => {
      const { container } = render(<RatingButton rating="easy" label="Легко" onClick={vi.fn()} />)
      const button = container.querySelector('button') as HTMLButtonElement
      expect(button.style.background).toBe('#3b82f6')
    })

    it('должен иметь атрибут type="button"', () => {
      const { container } = render(<RatingButton rating="hard" label="Сложно" onClick={vi.fn()} />)
      const button = container.querySelector('button')
      expect(button).toHaveAttribute('type', 'button')
    })
  })

  describe('взаимодействие', () => {
    it('должен вызывать onClick при клике', () => {
      const handleClick = vi.fn()
      render(<RatingButton rating="again" label="Снова" onClick={handleClick} />)

      const button = screen.getByText('Снова')
      button.click()

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })
})
