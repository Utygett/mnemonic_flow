import { useGeneralStats } from '../model/useGeneralStats'
import { RatingDistributionChart } from './RatingDistributionChart'

export function GeneralStatsSection() {
  const { data, isLoading, error } = useGeneralStats()

  if (isLoading) {
    return <div className="loading">Загрузка статистики...</div>
  }

  if (error) {
    return <div className="error">Ошибка загрузки статистики</div>
  }

  if (!data) return null

  const statsCards = [
    {
      icon: '⏱️',
      label: 'Общее время',
      value: data.totalStudyTimeFormatted,
      hint: 'Общее время обучения',
    },
    {
      icon: '📊',
      label: 'Средняя сессия',
      value: `${data.averageSessionDurationMinutes} мин`,
      hint: 'Среднее время за одно занятие',
    },
    {
      icon: '⚡',
      label: 'Изучено в день',
      value: Math.round(data.learningSpeedCardsPerDay).toString(),
      hint: 'Количество изученных карточек в день',
    },
    {
      icon: '🎯',
      label: 'Средняя оценка',
      value: `${Math.round((data.averageRating / 4) * 100)}%`,
      hint: 'Успешность повторений',
      showScale: true,
      scaleValue: (data.averageRating / 4) * 100,
    },
    {
      icon: '📝',
      label: 'Просмотрено карточек',
      value: data.totalReviews.toString(),
      hint: 'Общее количество просмотров',
    },
  ]

  return (
    <section className="statsSection">
      <h2 className="statsSection__title">Общая статистика</h2>

      <div className="statsCards">
        {statsCards.map((card, idx) => (
          <div key={idx} className="statsCard" title={card.hint}>
            <div className="statsCard__icon">{card.icon}</div>
            <div className="statsCard__label">{card.label}</div>
            <div className="statsCard__value">{card.value}</div>
            {(card as any).showScale && (
              <div className="statsCard__scale">
                <div className="statsCard__scaleBar">
                  <div
                    className="statsCard__scaleFill"
                    style={{ width: `${(card as any).scaleValue}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card mt-4">
        <RatingDistributionChart ratingDistribution={data.ratingDistribution} />
      </div>
    </section>
  )
}
