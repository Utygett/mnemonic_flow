import { useActivityChart } from '../model/useActivityChart'
import { ActivityLineChart } from './ActivityLineChart'
import { ActivityBarChart } from './ActivityBarChart'

export function ActivityChartSection() {
  const { data, isLoading, period, setPeriod, days, setDays } = useActivityChart()

  if (isLoading) {
    return <div className="loading">Загрузка графиков...</div>
  }

  if (data.length === 0) {
    return (
      <section className="statsSection">
        <h2 className="statsSection__title">Аналитика</h2>
        <div className="text-muted">Нет данных</div>
      </section>
    )
  }

  return (
    <section className="statsSection">
      <div className="statsSectionHead">
        <h2 className="statsSectionHead__title">Аналитика</h2>

        {/* Period selector */}
        <div className="segmented">
          <button
            className={`segmented__btn ${period === 'day' ? 'segmented__btn--active' : ''}`}
            onClick={() => setPeriod('day')}
          >
            День
          </button>
          <button
            className={`segmented__btn ${period === 'week' ? 'segmented__btn--active' : ''}`}
            onClick={() => setPeriod('week')}
          >
            Неделя
          </button>
          <button
            className={`segmented__btn ${period === 'month' ? 'segmented__btn--active' : ''}`}
            onClick={() => setPeriod('month')}
          >
            Месяц
          </button>
        </div>
      </div>

      {/* Line chart - activity trend */}
      <div className="spark">
        <ActivityLineChart data={data} />
      </div>

      {/* Bar chart - deck comparison or metric comparison */}
      <div className="spark" style={{ marginTop: '12px' }}>
        <ActivityBarChart data={data} />
      </div>
    </section>
  )
}
