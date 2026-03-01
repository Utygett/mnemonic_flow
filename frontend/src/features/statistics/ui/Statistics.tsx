import { GeneralStatsSection } from '@/features/stats-general'
import { ActivityHeatmap } from '@/features/stats-heatmap'
import { DeckProgressSection } from '@/features/stats-decks'
import { ActivityChartSection } from '@/features/stats-charts'

export function Statistics() {
  try {
    return (
      <div className="stats-page">
        <div className="page__header">
          <div className="page__header-inner statsHeader">
            <h1 className="page__title">Статистика</h1>
            <div className="statsHeader__sub">Ваша активность и прогресс</div>
          </div>
        </div>

        <main className="container-centered max-w-390" style={{ paddingBottom: '100px' }}>
          {/* General Statistics */}
          <GeneralStatsSection />

          {/* Activity Heatmap */}
          <ActivityHeatmap days={365} />

          {/* Deck Progress */}
          <DeckProgressSection />

          {/* Activity Charts */}
          <ActivityChartSection />
        </main>
      </div>
    )
  } catch (error) {
    console.error('Statistics render error:', error)
    return (
      <div className="stats-page">
        <div className="page__header">
          <div className="page__header-inner statsHeader">
            <h1 className="page__title">Статистика</h1>
          </div>
        </div>
        <main className="container-centered max-w-390">
          <div className="error">Ошибка загрузки статистики. Перезагрузите страницу.</div>
        </main>
      </div>
    )
  }
}
