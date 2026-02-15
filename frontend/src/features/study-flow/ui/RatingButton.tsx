import { formatInterval } from '@/shared/lib/formatInterval'

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
  intervalSeconds,
  onClick,
}: {
  rating: DifficultyRating
  label: string
  intervalSeconds?: number
  onClick: () => void
}) {
  const intervalText =
    intervalSeconds === undefined ? undefined : `через ${formatInterval(intervalSeconds)}`

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
        flexDirection: 'column',
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
      <span style={{ lineHeight: 1.1 }}>{label}</span>
      {intervalText && (
        <span
          style={{
            marginTop: '2px',
            fontSize: '10px',
            fontWeight: 500,
            opacity: 0.9,
            lineHeight: 1.1,
          }}
        >
          {intervalText}
        </span>
      )}
    </button>
  )
}
