import React from 'react'
import { Search } from 'lucide-react'

import type { PublicDeckSummary } from '@/entities/deck'
import { DeckCard } from '@/entities/deck'

import styles from './DeckListWithSearch.module.css'

type Props = {
  decks: PublicDeckSummary[]
  loading: boolean
  error: string | null
  searchQuery: string
  onSearchChange: (query: string) => void
  onDeckClick: (deck: PublicDeckSummary) => void
}

export function DeckListWithSearch({
  decks,
  loading,
  error,
  searchQuery,
  onSearchChange,
  onDeckClick,
}: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.searchWrapper}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Поиск по названию..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div className={styles.content}>
        {loading && decks.length === 0 && (
          <div className={styles.state}>
            <div className={styles.spinner}></div>
            <p>Загрузка колод...</p>
          </div>
        )}

        {error && (
          <div className={styles.state}>
            <p className={styles.error}>{error}</p>
          </div>
        )}

        {!loading && !error && decks.length === 0 && (
          <div className={styles.state}>
            <p>У вас пока нет колод</p>
          </div>
        )}

        {!loading && !error && decks.length > 0 && (
          <>
            {searchQuery && decks.length === 0 && (
              <div className={styles.state}>
                <p>Ничего не найдено</p>
              </div>
            )}

            <div className={styles.deckList}>
              {decks.map(deck => (
                <DeckCard key={deck.deck_id} deck={deck} onClick={() => onDeckClick(deck)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
