import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RatingButton } from './RatingButton'

describe('RatingButton', () => {
  describe('рендеринг', () => {
    it('должен отображать переданный label', () => {
      render(<RatingButton rating="good" label="Хорошо" onClick={vi.fn()} />)
      expect(screen.getByText('Хорошо')).toBeInTheDocument()
    })

    it('должен иметь правильный CSS класс для рейтинга', () => {
      const { container } = render(<RatingButton rating="easy" label="Легко" onClick={vi.fn()} />)
      const button = container.querySelector('button')
      expect(button).toHaveClass('rating-btn--easy')
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
