import React from 'react'

import { CreateCard } from '../../features/cards-create'
import { EditCard } from '../../features/cards-edit'
import { CreateDeck } from '../../features/deck-create'
import { EditDeck } from '../../features/deck-edit'
import { Statistics } from '../../features/statistics'
import { ProfileContainer } from '../../features/profile'

import { HomeTabContainer } from '../../features/dashboard'

import type { MnemonicRootSwitchProps } from './mnemonicRootSwitch.types'

import styles from './MnemonicRootSwitch.module.css'

export function MnemonicRootSwitch(props: MnemonicRootSwitchProps) {
  // loading
  // IMPORTANT: don't unmount current UI during background refresh (e.g. when AddDeck triggers refreshDecks).
  // Otherwise HomeTabContainer resets its local view state and user is "kicked out" of AddDeck screen.
  const isInitialDecksLoading = props.status.decksLoading && (props.data.decks?.length ?? 0) === 0
  const isInitialStatsLoading = props.status.statsLoading && !props.data.statistics

  if (isInitialDecksLoading || isInitialStatsLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-[#9CA3AF]">Загрузка данных...</p>
        </div>
      </div>
    )
  }

  // error
  if (props.status.decksError || props.status.statsError) {
    return (
      <div className={styles.errorContainer}>
        <div className={`card ${styles.errorCard}`}>
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-[#E8EAF0] mb-2">Ошибка загрузки</h2>
          <p className="text-[#9CA3AF] mb-4">
            {String(props.status.decksError ?? props.status.statsError)}
          </p>
          <button
            onClick={() => {
              props.refresh.refreshDecks()
              props.refresh.refreshStats()
            }}
            className="btn-primary"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  // flows
  if (props.cards.flow.isCreatingCard) {
    return (
      <CreateCard
        decks={props.data.decks}
        onSave={props.cards.actions.onCreateCardSave}
        onSaveMany={props.cards.actions.onCreateCardSaveMany}
        onCancel={props.cards.flow.closeCreateCard}
      />
    )
  }

  if (props.decks.flow.isCreatingDeck) {
    return (
      <CreateDeck
        onCancel={props.decks.flow.closeCreateDeck}
        onSave={(createdDeckId?: string) => {
          props.decks.actions.onDeckCreated()
          if (createdDeckId) {
            props.decks.flow.openEditDeck(createdDeckId)
          }
        }}
      />
    )
  }

  if (props.decks.flow.isEditingDeck && props.decks.flow.editingDeckId) {
    return (
      <EditDeck
        deckId={props.decks.flow.editingDeckId}
        onCancel={props.decks.flow.closeEditDeck}
        onSaved={props.decks.actions.onDeckSaved}
      />
    )
  }

  if (props.cards.flow.isEditingCard) {
    return (
      <EditCard
        decks={props.data.decks}
        onCancel={props.cards.flow.closeEditCard}
        onDone={props.cards.actions.onEditCardDone}
        onEditDeck={(deckId: string) => {
          props.decks.flow.openEditDeck(deckId)
        }}
      />
    )
  }

  // tabs
  return (
    <>
      {props.isPWA && (
        <div className={styles.pwaBadge}>
          <div className="pwa-badge">PWA</div>
        </div>
      )}

      {props.activeTab === 'home' && (
        <HomeTabContainer
          statistics={props.data.dashboardStats}
          decks={props.data.decks}
          groups={props.data.groups}
          activeGroupId={props.data.activeGroupId}
          setActiveGroupId={props.groupsActions.setActiveGroupId}
          refreshGroups={props.refresh.refreshGroups}
          refreshDecks={props.refresh.refreshDecks}
          currentGroupDeckIds={props.data.currentGroupDeckIds}
          onDeleteActiveGroup={props.groupsActions.deleteActiveGroup}
          resumeCandidate={props.study.resumeCandidate}
          onResume={props.study.onResume}
          onDiscardResume={props.study.onDiscardResume}
          onStartReviewStudy={props.study.onStartReviewStudy}
          onStartDeckStudy={props.study.onStartDeckStudy}
          onResumeDeckSession={props.study.onResumeDeckSession}
          onRestartDeckSession={props.study.onRestartDeckSession}
          onOpenEditDeck={props.decks.flow.openEditDeck}
        />
      )}

      {props.activeTab === 'study' && (
        <div className={styles.tabPage}>
          <header className="page__header">
            <div className="page__header-inner">
              <h1 className="page__title">Обучение</h1>
            </div>
          </header>

          <main className={`container-centered max-w-390 ${styles.tabMain}`}>
            <div className={styles.emptyState}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</div>
              <h2 style={{ marginBottom: '1rem', color: '#E8EAF0' }}>
                Создайте свою первую карточку
              </h2>
              <p style={{ color: '#9CA3AF', marginBottom: '1.5rem' }}>
                Начните изучение с создания карточек
              </p>

              <div className="actionsStack__study">
                <button onClick={props.cards.flow.openCreateCard} className="btn-primary">
                  Создать карточку
                </button>

                <button onClick={props.decks.flow.openCreateDeck} className="btn-primary">
                  Создать колоду
                </button>

                <button onClick={props.cards.flow.openEditCard} className="btn-primary">
                  Редактировать карточки
                </button>
              </div>

              {!props.isPWA && (
                <div className={`card ${styles.pwaTip}`}>
                  <p style={{ color: '#9CA3AF', marginBottom: '0.5rem' }}>
                    💡 Установите приложение для работы офлайн
                  </p>
                  <p style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                    Нажмите "Установить" в меню браузера
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {props.activeTab === 'stats' && props.data.statistics && (
        <Statistics statistics={props.data.statistics} decks={props.data.decks} />
      )}

      {props.activeTab === 'profile' && <ProfileContainer isPWA={props.isPWA} />}
    </>
  )
}
