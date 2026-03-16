import React from 'react'
import type { PublicDeckSummary } from '@/entities/deck'
import styles from './MoveCardSheet.module.css'

type Props = {
  currentDeckId: string
  decks: PublicDeckSummary[]
  onMove: (targetDeckId: string) => void
  onClose: () => void
}

export function MoveCardSheet({ currentDeckId, decks, onMove, onClose }: Props) {
  // exclude only the current deck — all decks here belong to the user (getUserDecks)
  const available = decks.filter(d => d.deck_id !== currentDeckId)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />
        <h3 className={styles.title}>Переместить карточку</h3>

        {available.length === 0 ? (
          <p className={styles.empty}>Нет других доступных колод</p>
        ) : (
          <ul className={styles.list}>
            {available.map(deck => (
              <li key={deck.deck_id}>
                <button
                  type="button"
                  className={styles.deckItem}
                  onClick={() => onMove(deck.deck_id)}
                >
                  <span className={styles.deckTitle}>{deck.title}</span>
                  {deck.cards_count != null && (
                    <span className={styles.deckMeta}>{deck.cards_count} карт.</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className={styles.cancelButton} onClick={onClose}>
          Отмена
        </button>
      </div>
    </div>
  )
}
