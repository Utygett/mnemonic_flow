interface TotalStudyTimeCardProps {
  totalMinutes: number
  formatted: string
}

export function TotalStudyTimeCard({ totalMinutes, formatted }: TotalStudyTimeCardProps) {
  return (
    <div className="statCard">
      <div className="statCard__top">
        <div className="statCard__icon">⏱️</div>
        <div className="statCard__label">Общее время</div>
      </div>
      <div className="statCard__value">{formatted}</div>
      <div className="statCard__hint">
        {totalMinutes < 60
          ? `${totalMinutes} минут обучения`
          : `${Math.floor(totalMinutes / 60)} часов ${totalMinutes % 60} минут`}
      </div>
    </div>
  )
}
