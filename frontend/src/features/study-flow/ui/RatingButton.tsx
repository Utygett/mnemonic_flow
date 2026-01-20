import React from 'react'

export type DifficultyRating = 'again' | 'hard' | 'good' | 'easy'

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
    <button type="button" className={`rating-btn rating-btn--${rating}`} onClick={onClick}>
      {label}
    </button>
  )
}
