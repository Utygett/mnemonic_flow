import type { DeckProgressStats } from '@/entities/statistics/model/types'
import { DeckProgressBar } from './DeckProgressBar'

interface DeckProgressCardProps {
  deck: DeckProgressStats
}

export function DeckProgressCard({ deck }: DeckProgressCardProps) {
  const handleClick = () => {
    // TODO: Implement navigation to deck details
    console.log('Navigate to deck:', deck.deckId)
  }

  return (
    <div className="statsDeck" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className="statsDeck__row">
        <div className="statsDeck__left">
          <div className="statsDeck__colorIndicator" style={{ backgroundColor: deck.deckColor }} />
          <div>
            <div className="statsDeck__title">{deck.deckTitle}</div>
            <div className="statsDeck__meta">
              {deck.totalReviews} ревью • {formatTime(deck.totalStudyTimeMinutes)}
            </div>
          </div>
        </div>
        <div className="statsDeck__percent">{deck.progressPercentage}%</div>
      </div>

      <DeckProgressBar
        mastered={deck.masteredCards}
        learning={deck.learningCards}
        newCards={deck.newCards}
        total={deck.totalCards}
      />

      <div className="statsDeck__levels">
        <div className="statsDeck__levelsLabel">Статус карточек:</div>
        <div className="statsDeck__levelsList">
          <span>{deck.masteredCards} выучено</span>
          <span>{deck.learningCards} изучается</span>
          <span>{deck.newCards} новых</span>
        </div>
      </div>
    </div>
  )
}

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`
}
