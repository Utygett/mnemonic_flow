import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FlipCard } from './FlipCard'
import { createMockFlashcard, createMockMcqCard } from '../model/test/fixtures'

// Мокаем motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, onClick, animate, className, style }: any) => (
      <div onClick={onClick} className={className} style={style} data-animate={animate}>
        {children}
      </div>
    ),
  },
}))

// Мокаем MarkdownView для простоты
vi.mock('@/shared/ui/MarkdownView', () => ({
  MarkdownView: ({ value }: { value: string }) => <div>{value}</div>,
}))

describe('FlipCard', () => {
  describe('рендеринг flashcard', () => {
    it('должен отображать вопрос на лицевой стороне', () => {
      const card = createMockFlashcard({
        levels: [
          {
            levelindex: 0,
            content: { question: 'Question text', answer: 'Answer text' },
          },
        ],
      })

      render(<FlipCard card={card} isFlipped={false} onFlip={vi.fn()} />)

      expect(screen.getByText('Question text')).toBeInTheDocument()
    })

    it('должен отображать ответ на обратной стороне', () => {
      const card = createMockFlashcard({
        levels: [
          {
            levelindex: 0,
            content: { question: 'Question', answer: 'Answer text' },
          },
        ],
      })

      render(<FlipCard card={card} isFlipped={true} onFlip={vi.fn()} />)

      expect(screen.getByText('Answer text')).toBeInTheDocument()
    })

    it('должен отображать подсказку на лицевой стороне', () => {
      const card = createMockFlashcard()
      render(<FlipCard card={card} isFlipped={false} onFlip={vi.fn()} />)

      expect(screen.getByText('Нажмите, чтобы увидеть ответ')).toBeInTheDocument()
    })
  })

  describe('рендеринг MCQ', () => {
    it('должен отображать вопрос MCQ карточки', () => {
      const card = createMockMcqCard({
        levels: [
          {
            levelindex: 0,
            content: {
              question: 'MCQ Question',
              options: [{ id: 'a', text: 'Option A' }],
              correctOptionId: 'a',
            },
          },
        ],
      })

      render(<FlipCard card={card} isFlipped={false} onFlip={vi.fn()} />)

      expect(screen.getByText('MCQ Question')).toBeInTheDocument()
    })
  })

  describe('управление уровнями', () => {
    it('должен показывать кнопку "проще" если есть предыдущий уровень', () => {
      const card = createMockFlashcard({
        activeLevel: 1,
        levels: [
          { levelindex: 0, content: { question: 'Q1', answer: 'A1' } },
          { levelindex: 1, content: { question: 'Q2', answer: 'A2' } },
        ],
      })

      render(<FlipCard card={card} isFlipped={true} onFlip={vi.fn()} onLevelDown={vi.fn()} />)

      expect(screen.getByText(/проще/)).toBeInTheDocument()
    })

    it('не должен показывать кнопку "проще" на первом уровне', () => {
      const card = createMockFlashcard({
        activeLevel: 0,
        levels: [{ levelindex: 0, content: { question: 'Q', answer: 'A' } }],
      })

      render(<FlipCard card={card} isFlipped={true} onFlip={vi.fn()} onLevelDown={vi.fn()} />)

      expect(screen.queryByText(/проще/)).not.toBeInTheDocument()
    })

    it('должен показывать кнопку "сложнее" если есть следующий уровень', () => {
      const card = createMockFlashcard({
        activeLevel: 0,
        levels: [
          { levelindex: 0, content: { question: 'Q1', answer: 'A1' } },
          { levelindex: 1, content: { question: 'Q2', answer: 'A2' } },
        ],
      })

      render(<FlipCard card={card} isFlipped={true} onFlip={vi.fn()} onLevelUp={vi.fn()} />)

      expect(screen.getByText(/сложнее/)).toBeInTheDocument()
    })

    it('не должен показывать кнопку "сложнее" на последнем уровне', () => {
      const card = createMockFlashcard({
        activeLevel: 0,
        levels: [{ levelindex: 0, content: { question: 'Q', answer: 'A' } }],
      })

      render(<FlipCard card={card} isFlipped={true} onFlip={vi.fn()} onLevelUp={vi.fn()} />)

      expect(screen.queryByText(/сложнее/)).not.toBeInTheDocument()
    })
  })

  describe('взаимодействие', () => {
    it('должен вызывать onFlip при клике', () => {
      const handleFlip = vi.fn()
      const card = createMockFlashcard({
        levels: [
          {
            levelindex: 0,
            content: { question: 'Question text', answer: 'Answer text' },
          },
        ],
      })

      render(<FlipCard card={card} isFlipped={false} onFlip={handleFlip} />)

      const flipcard = screen.getByText('Question text').closest('div')?.parentElement
      flipcard?.click()

      expect(handleFlip).toHaveBeenCalledTimes(1)
    })

    it('не должен вызывать onFlip при клике если disableFlipOnClick=true', () => {
      const handleFlip = vi.fn()
      const card = createMockFlashcard({
        levels: [
          {
            levelindex: 0,
            content: { question: 'Question text', answer: 'Answer text' },
          },
        ],
      })

      render(<FlipCard card={card} isFlipped={false} onFlip={handleFlip} disableFlipOnClick />)

      const flipcard = screen.getByText('Question text').closest('div')?.parentElement
      flipcard?.click()

      expect(handleFlip).not.toHaveBeenCalled()
    })

    it('должен вызывать onLevelDown при клике на кнопку "проще"', () => {
      const handleLevelDown = vi.fn()
      const card = createMockFlashcard({
        activeLevel: 1,
        levels: [
          { levelindex: 0, content: { question: 'Q1', answer: 'A1' } },
          { levelindex: 1, content: { question: 'Q2', answer: 'A2' } },
        ],
      })

      render(
        <FlipCard card={card} isFlipped={true} onFlip={vi.fn()} onLevelDown={handleLevelDown} />
      )

      const btn = screen.getByText(/проще/)
      btn.click()

      expect(handleLevelDown).toHaveBeenCalledTimes(1)
    })

    it('должен вызывать onLevelUp при клике на кнопку "сложнее"', () => {
      const handleLevelUp = vi.fn()
      const card = createMockFlashcard({
        activeLevel: 0,
        levels: [
          { levelindex: 0, content: { question: 'Q1', answer: 'A1' } },
          { levelindex: 1, content: { question: 'Q2', answer: 'A2' } },
        ],
      })

      render(<FlipCard card={card} isFlipped={true} onFlip={vi.fn()} onLevelUp={handleLevelUp} />)

      const btn = screen.getByText(/сложнее/)
      btn.click()

      expect(handleLevelUp).toHaveBeenCalledTimes(1)
    })
  })

  describe('кастомный контент', () => {
    it('должен отображать frontContent вместо вопроса', () => {
      const card = createMockFlashcard()
      render(
        <FlipCard
          card={card}
          isFlipped={false}
          onFlip={vi.fn()}
          frontContent={<div>Custom Front</div>}
        />
      )

      expect(screen.getByText('Custom Front')).toBeInTheDocument()
    })

    it('должен отображать backContent вместо ответа', () => {
      const card = createMockFlashcard()
      render(
        <FlipCard
          card={card}
          isFlipped={true}
          onFlip={vi.fn()}
          backContent={<div>Custom Back</div>}
        />
      )

      expect(screen.getByText('Custom Back')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('должен отображать title если content.question отсутствует', () => {
      const card = createMockFlashcard({
        title: 'Card Title',
        levels: [{ levelindex: 0, content: { question: '', answer: 'A' } }],
      })

      render(<FlipCard card={card} isFlipped={false} onFlip={vi.fn()} />)

      expect(screen.getByText('Card Title')).toBeInTheDocument()
    })

    it('должен отображать "…" если отсутствуют question и title', () => {
      const card = createMockFlashcard({
        title: '',
        levels: [{ levelindex: 0, content: { question: '', answer: 'A' } }],
      })

      render(<FlipCard card={card} isFlipped={false} onFlip={vi.fn()} />)

      expect(screen.getByText('…')).toBeInTheDocument()
    })
  })
})
