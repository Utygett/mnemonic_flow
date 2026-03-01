interface SessionStatsCardProps {
  averageSessionMinutes: number
  learningSpeed: number
}

export function SessionStatsCard({ averageSessionMinutes, learningSpeed }: SessionStatsCardProps) {
  return (
    <div className="statCard">
      <div className="statCard__top">
        <div className="statCard__icon">📊</div>
        <div className="statCard__label">Сессии и скорость</div>
      </div>
      <div className="statCard__value">{averageSessionMinutes} мин</div>
      <div className="statCard__hint">Средняя сессия • {learningSpeed} новых карт/день</div>
    </div>
  )
}
