import React from 'react'

import { CreateCard } from '../../features/cards-create'
import { EditCard } from '../../features/cards-edit'
import { CreateDeck } from '../../features/deck-create'
import { EditDeck } from '../../features/deck-edit'
import { Statistics } from '../../features/statistics'
import { ProfileContainer } from '../../features/profile'

import { HomeTabContainer, HomeDashboardView } from '../../features/dashboard'

import { addDeckToGroup } from '../../entities/group'

import type { MnemonicRootSwitchProps } from './mnemonicRootSwitch.types'

import styles from './MnemonicRootSwitch.module.css'

export function MnemonicRootSwitch(props: MnemonicRootSwitchProps) {
  // loading
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
        onSave={async (createdDeckId?: string) => {
          // Add deck to active group if one is selected
          if (createdDeckId && props.data.activeGroupId) {
            try {
              await addDeckToGroup(props.data.activeGroupId, createdDeckId)
            } catch (e) {
              console.error('Failed to add deck to group:', e)
            }
          }
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
        mode="session"
        initialCardId={props.cards.flow.editingCardId ?? undefined}
        initialDeckId={props.cards.flow.editingDeckId ?? undefined}
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
        <HomeDashboardView
          statistics={props.data.dashboardStats}
          decks={props.data.decks}
          resumeCandidate={props.study.resumeCandidate}
          onResume={props.study.onResume}
          onDiscardResume={props.study.onDiscardResume}
          onStartStudy={props.study.onStartReviewStudy}
        />
      )}

      {props.activeTab === 'study' && (
        <HomeTabContainer
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
          onStartDeckStudy={props.study.onStartDeckStudy}
          onResumeDeckSession={props.study.onResumeDeckSession}
          onRestartDeckSession={props.study.onRestartDeckSession}
          onOpenEditDeck={props.decks.flow.openEditDeck}
          onEditCard={(cardId: string, deckId: string) =>
            props.cards.flow.openEditCard(cardId, deckId)
          }
          onAddCard={() => props.cards.flow.openCreateCard()}
          onCreateDeck={props.decks.flow.openCreateDeck}
          onSubScreenChange={props.onStudySubScreenChange}
        />
      )}

      {props.activeTab === 'stats' && props.data.statistics && (
        <Statistics statistics={props.data.statistics} decks={props.data.decks} />
      )}

      {props.activeTab === 'profile' && <ProfileContainer />}
    </>
  )
}
