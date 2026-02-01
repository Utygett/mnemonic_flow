export type DifficultyRating = 'again' | 'hard' | 'good' | 'easy'

const ratingStyles: Record<
  DifficultyRating,
  { background: string; color: string; borderColor: string }
> = {
  again: {
    background: '#ef4444',
    color: '#ffffff',
    borderColor: '#ef4444',
  },
  hard: {
    background: '#f97316',
    color: '#ffffff',
    borderColor: '#f97316',
  },
  good: {
    background: '#22c55e',
    color: '#ffffff',
    borderColor: '#22c55e',
  },
  easy: {
    background: '#3b82f6',
    color: '#ffffff',
    borderColor: '#3b82f6',
  },
}

export function RatingButton({
  rating,
  label,
  onClick,
}: {
  rating: DifficultyRating
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      style={{
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        border: '2px solid',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        transition: 'transform 0.2s ease',
        ...ratingStyles[rating],
      }}
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.05)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {label}
    </button>
  )
}
