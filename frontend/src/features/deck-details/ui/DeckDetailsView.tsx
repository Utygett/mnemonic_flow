import React from 'react'
import { Plus } from 'lucide-react'

import type { DeckDetailsViewModel } from '../model/useDeckDetailsModel'
import { Button } from '@/shared/ui/Button/Button'
import { CardListItem } from './CardListItem'
import { CardPreviewModal } from './CardPreviewModal'
import { StudyModeSelector } from './StudyModeSelector'

import styles from './DeckDetailsView.module.css'

export function DeckDetailsView(props: DeckDetailsViewModel) {
  const [previewCardId, setPreviewCardId] = React.useState<string | null>(null)

  const previewCard = previewCardId
    ? (props.cards.find(c => c.card_id === previewCardId) ?? null)
    : null

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <Button onClick={props.onBack} variant="secondary" size="small">
            Назад
          </Button>
          <h1 className={styles.title}>{props.deckTitle || 'Колода'}</h1>
          {props.deckDescription && <p className={styles.description}>{props.deckDescription}</p>}
          <div className={styles.meta}>
            {props.cards.length}{' '}
            {props.cards.length === 1
              ? 'карточка'
              : props.cards.length >= 2 && props.cards.length <= 4
                ? 'карточки'
                : 'карточек'}
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.stack}>
          <StudyModeSelector
            saved={props.saved}
            hasSaved={props.hasSaved}
            limit={props.limit}
            setLimit={props.setLimit}
            limitClamped={props.limitClamped}
            onResume={props.onResume}
            onStart={props.onStart}
          />

          <div className={styles.cardListSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Карточки</h2>
              <Button
                onClick={props.onAddCard}
                variant="primary"
                size="small"
                aria-label="Добавить карточку"
              >
                <Plus size={16} strokeWidth={2} />
                Добавить
              </Button>
            </div>

            {props.cardsLoading && (
              <div className={styles.cardsLoading}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
              </div>
            )}

            {props.cardsError && (
              <div className={styles.cardsError}>
                <p>Ошибка загрузки карточек</p>
                <Button onClick={props.refreshCards} variant="secondary" size="small">
                  Повторить
                </Button>
              </div>
            )}

            {!props.cardsLoading && !props.cardsError && props.cards.length === 0 && (
              <div className={styles.emptyCards}>
                <p>В колоде пока нет карточек</p>
              </div>
            )}

            {!props.cardsLoading && !props.cardsError && props.cards.length > 0 && (
              <div className={styles.cardList}>
                {props.cards.map(card => (
                  <CardListItem
                    key={card.card_id}
                    card={card}
                    canEdit={props.canEdit}
                    onEdit={props.onEditCard}
                    onClick={() => setPreviewCardId(card.card_id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {previewCard && (
        <CardPreviewModal
          card={previewCard}
          canEdit={props.canEdit}
          onEdit={cardId => {
            setPreviewCardId(null)
            props.onEditCard(cardId)
          }}
          onClose={() => setPreviewCardId(null)}
        />
      )}
    </div>
  )
}
