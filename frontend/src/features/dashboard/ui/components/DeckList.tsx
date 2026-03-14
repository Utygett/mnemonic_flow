import React from 'react'

import type { PublicDeckSummary } from '@/entities/deck'
import { DeckCard } from '@/entities/deck'

import styles from './DeckList.module.css'

type Props = {
  decks: PublicDeckSummary[]
  onDeckClick: (deckId: string) => void
  onEditDeck?: (deckId: string) => void
  onDeleteDeck?: (deckId: string) => void
  onMoveDeck?: (deckId: string) => void
}

export function DeckList({ decks, onDeckClick, onEditDeck, onDeleteDeck, onMoveDeck }: Props) {
  void onEditDeck
  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {decks.map(deck => (
          <DeckCard
            key={deck.deck_id}
            deck={deck}
            onClick={() => onDeckClick(deck.deck_id)}
            onDelete={onDeleteDeck ? () => onDeleteDeck(deck.deck_id) : undefined}
            onMove={onMoveDeck ? () => onMoveDeck(deck.deck_id) : undefined}
          />
        ))}
      </div>
    </div>
  )
}
