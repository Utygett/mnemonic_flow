import React from 'react'

import { EditCard } from './EditCard'
import type { CardSavedPayload } from '../model/types'

import styles from './EditCardModal.module.css'

type Props = {
  isOpen: boolean
  deckId: string
  cardId: string
  onClose: () => void
  onSaved?: (payload: CardSavedPayload) => void
}

export function EditCardModal({ isOpen, deckId, cardId, onClose, onSaved }: Props) {
  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <EditCard
          mode="session"
          initialDeckId={deckId}
          initialCardId={cardId}
          decks={[]}
          onCancel={onClose}
          onDone={onClose}
          onSaved={onSaved}
        />
      </div>
    </div>
  )
}
