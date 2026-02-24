import React from 'react'

import type { PublicDeckSummary } from '@/entities/deck'
import { DeckCard } from '@/entities/deck'

import styles from './DeckList.module.css'

type Props = {
  decks: PublicDeckSummary[]
  onDeckClick: (deckId: string) => void
  onEditDeck?: (deckId: string) => void
  onDeleteDeck?: (deckId: string) => void
}

export function DeckList({ decks, onDeckClick, onEditDeck, onDeleteDeck }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {decks.map(deck => (
          <DeckCard
            key={deck.deck_id}
            deck={deck}
            onClick={() => onDeckClick(deck.deck_id)}
            onEdit={onEditDeck ? () => onEditDeck(deck.deck_id) : undefined}
            onDelete={onDeleteDeck ? () => onDeleteDeck(deck.deck_id) : undefined}
          />
        ))}
      </div>
    </div>
  )
}
