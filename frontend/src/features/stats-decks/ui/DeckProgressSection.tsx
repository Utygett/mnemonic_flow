import { useDeckProgress } from '../model/useDeckProgress'
import { DeckProgressCard } from './DeckProgressCard'

export function DeckProgressSection() {
  const { data, isLoading } = useDeckProgress()

  if (isLoading) {
    return <div className="loading">Загрузка колод...</div>
  }

  if (!data || data.length === 0) {
    return (
      <section className="statsSection">
        <h2 className="statsSection__title">Колоды</h2>
        <div className="text-muted">Нет колод</div>
      </section>
    )
  }

  return (
    <section className="statsSection">
      <h2 className="statsSection__title">Прогресс по колодам</h2>

      <div className="statsDecks">
        {data.map(deck => (
          <DeckProgressCard key={deck.deckId} deck={deck} />
        ))}
      </div>
    </section>
  )
}
