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
      label: 'Скорость',
      value: `${data.learningSpeedCardsPerDay}/день`,
      hint: 'Новых карточек в день',
    },
    {
      icon: '🎯',
      label: 'Средняя оценка',
      value: data.averageRating.toFixed(1),
      hint: 'По шкале от 1.0 до 4.0',
    },
    {
      icon: '📝',
      label: 'Всего ревью',
      value: data.totalReviews.toString(),
      hint: 'Суммарно количество оценок',
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
          </div>
        ))}
      </div>

      <div className="card mt-4">
        <RatingDistributionChart ratingDistribution={data.ratingDistribution} />
      </div>
    </section>
  )
}
