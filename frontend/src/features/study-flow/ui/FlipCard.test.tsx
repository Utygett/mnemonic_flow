import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FlipCard } from './FlipCard'
import { createMockFlashcard, createMockMcqCard } from '../model/test/fixtures'

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, onClick, animate, className, style }: any) => (
      <div onClick={onClick} className={className} style={style} data-animate={animate}>
        {children}
      </div>
    ),
  },
}))

vi.mock('@/shared/ui/MarkdownView', () => ({
  MarkdownView: ({ value }: { value: string }) => <div>{value}</div>,
}))

describe('FlipCard', () => {
  describe('рендеринг flashcard', () => {
    it('должен отображать вопрос на лицевой стороне', () => {
      const card = createMockFlashcard({
        levels: [{ levelindex: 0, content: { question: 'Question text', answer: 'Answer text' } }],
      })
      render(<FlipCard card={card} isFlipped={false} onFlip={vi.fn()} />)
      expect(screen.getByText('Question text')).toBeInTheDocument()
    })

    it('должен отображать ответ на обратной стороне', () => {
      const card = createMockFlashcard({
        levels: [{ levelindex: 0, content: { question: 'Question', answer: 'Answer text' } }],
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

  describe('взаимодействие', () => {
    it('должен вызывать onFlip при клике', () => {
      const handleFlip = vi.fn()
      const card = createMockFlashcard({
        levels: [{ levelindex: 0, content: { question: 'Question text', answer: 'Answer text' } }],
      })
      render(<FlipCard card={card} isFlipped={false} onFlip={handleFlip} />)
      const flipcard = screen.getByText('Question text').closest('div')?.parentElement
      flipcard?.click()
      expect(handleFlip).toHaveBeenCalledTimes(1)
    })

    it('не должен вызывать onFlip при клике если disableFlipOnClick=true', () => {
      const handleFlip = vi.fn()
      const card = createMockFlashcard({
        levels: [{ levelindex: 0, content: { question: 'Question text', answer: 'Answer text' } }],
      })
      render(<FlipCard card={card} isFlipped={false} onFlip={handleFlip} disableFlipOnClick />)
      const flipcard = screen.getByText('Question text').closest('div')?.parentElement
      flipcard?.click()
      expect(handleFlip).not.toHaveBeenCalled()
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
    it('должен отображать title если content.question отсутствует и showCardTitle=true', () => {
      const card = createMockFlashcard({
        title: 'Card Title',
        levels: [{ levelindex: 0, content: { question: '', answer: 'A' } }],
      })
      render(<FlipCard card={card} isFlipped={false} onFlip={vi.fn()} showCardTitle={true} />)
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
