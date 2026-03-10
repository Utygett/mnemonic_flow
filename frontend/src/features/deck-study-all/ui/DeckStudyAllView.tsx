import React, { useState } from 'react'

import type { DeckStudyAllViewModel } from '../model/useDeckStudyAllModel'
import { StudyModePickerModal } from './StudyModePickerModal'

import { DeckListWithSearch } from './DeckListWithSearch'

import styles from './DeckStudyAllView.module.css'

export function DeckStudyAllView(props: DeckStudyAllViewModel) {
  const [selectedDeck, setSelectedDeck] = useState<
    React.ComponentProps<typeof StudyModePickerModal>['deck'] | null
  >(null)

  const handleDeckClick = (deck: React.ComponentProps<typeof StudyModePickerModal>['deck']) => {
    setSelectedDeck(deck)
  }

  const handleStudyStart = (deckId: string, mode: import('@/entities/card').StudyMode) => {
    setSelectedDeck(null)
    props.onStudyStart(deckId, mode)
  }

  const handleCloseModal = () => {
    setSelectedDeck(null)
  }

  return (
    <>
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={props.onBack}>
            ← Назад
          </button>
          <h1 className={styles.title}>Выберите колоду</h1>
        </div>

        <DeckListWithSearch
          decks={props.filteredDecks}
          loading={props.loading}
          error={props.error}
          searchQuery={props.searchQuery}
          onSearchChange={props.setSearchQuery}
          onDeckClick={handleDeckClick}
        />
      </div>

      {selectedDeck && (
        <StudyModePickerModal
          deck={selectedDeck}
          onStudyStart={handleStudyStart}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}
