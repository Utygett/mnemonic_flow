import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StudySession } from './StudySession'
import { createMockFlashcard } from '../model/test/fixtures'

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, onClick, className, style }: any) => (
      <div onClick={onClick} className={className} style={style}>
        {children}
      </div>
    ),
  },
}))
vi.mock('@/shared/ui/MarkdownView', () => ({
  MarkdownView: ({ value }: { value: string }) => <div>{value}</div>,
}))
vi.mock('@/shared/ui/Button/Button', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}))
vi.mock('@/shared/ui/ProgressBar', () => ({
  ProgressBar: () => <div />,
}))
vi.mock('@/entities/card', () => ({
  getReviewPreview: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/features/cards-edit/ui/EditCardModal', () => ({
  EditCardModal: () => null,
}))
vi.mock('@/features/card-comments', () => ({
  CardComments: () => null,
}))

const baseProps = {
  currentIndex: 0,
  onRate: vi.fn(),
  onClose: vi.fn(),
  onSkip: vi.fn(),
  onRemoveFromProgress: vi.fn(),
  onLevelUp: vi.fn(),
  onLevelDown: vi.fn(),
}

describe('StudySession — управление уровнями', () => {
  it('показывает кнопку повышения уровня если есть следующий уровень', () => {
    const card = createMockFlashcard({
      activeLevel: 0,
      levels: [
        { levelindex: 0, content: { question: 'Q1', answer: 'A1' } },
        { levelindex: 1, content: { question: 'Q2', answer: 'A2' } },
      ],
    })
    render(<StudySession {...baseProps} cards={[card]} />)
    expect(screen.getByText(/Повысить уровень/)).toBeInTheDocument()
  })

  it('не показывает кнопку повышения если уровень один', () => {
    const card = createMockFlashcard({
      activeLevel: 0,
      levels: [{ levelindex: 0, content: { question: 'Q', answer: 'A' } }],
    })
    render(<StudySession {...baseProps} cards={[card]} />)
    expect(screen.queryByText(/Повысить уровень/)).not.toBeInTheDocument()
  })

  it('показывает кнопку понижения уровня если есть предыдущий уровень', () => {
    const card = createMockFlashcard({
      activeLevel: 1,
      levels: [
        { levelindex: 0, content: { question: 'Q1', answer: 'A1' } },
        { levelindex: 1, content: { question: 'Q2', answer: 'A2' } },
      ],
    })
    render(<StudySession {...baseProps} cards={[card]} />)
    expect(screen.getByText(/Понизить уровень/)).toBeInTheDocument()
  })

  it('вызывает onLevelUp при клике', () => {
    const onLevelUp = vi.fn()
    const card = createMockFlashcard({
      activeLevel: 0,
      levels: [
        { levelindex: 0, content: { question: 'Q1', answer: 'A1' } },
        { levelindex: 1, content: { question: 'Q2', answer: 'A2' } },
      ],
    })
    render(<StudySession {...baseProps} onLevelUp={onLevelUp} cards={[card]} />)
    screen.getByText(/Повысить уровень/).click()
    expect(onLevelUp).toHaveBeenCalledTimes(1)
  })

  it('вызывает onLevelDown при клике', () => {
    const onLevelDown = vi.fn()
    const card = createMockFlashcard({
      activeLevel: 1,
      levels: [
        { levelindex: 0, content: { question: 'Q1', answer: 'A1' } },
        { levelindex: 1, content: { question: 'Q2', answer: 'A2' } },
      ],
    })
    render(<StudySession {...baseProps} onLevelDown={onLevelDown} cards={[card]} />)
    screen.getByText(/Понизить уровень/).click()
    expect(onLevelDown).toHaveBeenCalledTimes(1)
  })
})
