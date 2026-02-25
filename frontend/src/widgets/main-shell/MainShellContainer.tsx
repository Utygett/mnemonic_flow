import React, { useState } from 'react'

import { useStatistics } from './model/useStatistics'
import { useGroupsDecksController } from './model/useGroupsDecksController'
import { useDifficultyDistribution } from './model/useDifficultyDistribution'

import { StudyFlowStateContainer } from '@/features/study-flow'

import { CardsActionsContainer } from '@/features/cards-actions'
import type { CardsActionsApi } from '@/features/cards-actions'
import { CardsFlowContainer } from '@/features/cards-flow'
import type { CardsFlowApi } from '@/features/cards-flow'

import { DecksActionsContainer } from '@/features/decks-actions'
import type { DecksActionsApi } from '@/features/decks-actions'
import { DecksFlowContainer } from '@/features/decks-flow'
import type { DecksFlowApi } from '@/features/decks-flow'

import { useIsPWA } from '@/app/pwa/useIsPWA'
import { useRegisterServiceWorker } from '@/app/pwa/useRegisterServiceWorker'

import { MainShellView } from './MainShellView'
import { MnemonicRootSwitch } from './MnemonicRootSwitch'
import type { MainTab } from './mainShell.types'

export function MainShellContainer() {
  const {
    groups,
    activeGroupId,
    setActiveGroupId,
    decks,
    decksLoading,
    decksError,
    refreshDecks,
    refreshGroups,
    deleteActiveGroup,
    currentGroupDeckIds,
  } = useGroupsDecksController()

  const {
    statistics,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats,
  } = useStatistics()

  const {
    distribution: difficultyDistribution,
    loading: difficultyLoading,
    error: difficultyError,
    refresh: refreshDifficultyDistribution,
  } = useDifficultyDistribution()

  const dashboardStats = statistics ?? {
    cardsStudiedToday: 0,
    timeSpentToday: 0,
    currentStreak: 0,
    totalCards: 0,
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
    achievements: [],
  }

  const defaultDifficultyDistribution = {
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0,
    totalCount: 0,
  }

  const [activeTab, setActiveTab] = useState<MainTab>('home')
  const [isStudySubScreen, setIsStudySubScreen] = useState(false)

  const handleNavigateToStats = () => {
    setActiveTab('stats')
  }

  useRegisterServiceWorker()
  const isPWA = useIsPWA()

  return (
    <StudyFlowStateContainer
      onExitToHome={() => {
        setActiveTab('home')
        setIsStudySubScreen(false)
      }}
      onRated={() => {
        refreshStats()
        refreshDifficultyDistribution()
      }}
    >
      {study => (
        <DecksFlowContainer>
          {(decksFlow: DecksFlowApi) => (
            <DecksActionsContainer
              refreshDecks={refreshDecks}
              closeCreateDeck={decksFlow.closeCreateDeck}
              closeEditDeck={decksFlow.closeEditDeck}
            >
              {(decksApi: DecksActionsApi) => (
                <CardsFlowContainer>
                  {(cardsFlow: CardsFlowApi) => {
                    const hideBottomNav =
                      study.isStudying ||
                      decksLoading ||
                      statsLoading ||
                      Boolean(statsError) ||
                      cardsFlow.isCreatingCard ||
                      cardsFlow.isEditingCard ||
                      decksFlow.isCreatingDeck ||
                      decksFlow.isEditingDeck ||
                      isStudySubScreen

                    return (
                      <CardsActionsContainer
                        refreshDecks={refreshDecks}
                        refreshStats={refreshStats}
                        closeCreateCard={cardsFlow.closeCreateCard}
                        closeEditCard={cardsFlow.closeEditCard}
                      >
                        {(cardsApi: CardsActionsApi) => (
                          <MainShellView
                            hideBottomNav={hideBottomNav}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            content={
                              <MnemonicRootSwitch
                                study={study}
                                activeTab={activeTab}
                                isPWA={isPWA}
                                cards={{ flow: cardsFlow, actions: cardsApi }}
                                decks={{ flow: decksFlow, actions: decksApi }}
                                data={{
                                  decks,
                                  groups,
                                  activeGroupId,
                                  currentGroupDeckIds,
                                  statistics,
                                  dashboardStats,
                                  difficultyDistribution:
                                    difficultyDistribution ?? defaultDifficultyDistribution,
                                }}
                                status={{
                                  decksLoading,
                                  statsLoading,
                                  decksError,
                                  statsError,
                                }}
                                refresh={{
                                  refreshDecks,
                                  refreshGroups,
                                  refreshStats,
                                }}
                                groupsActions={{
                                  setActiveGroupId,
                                  deleteActiveGroup,
                                }}
                                onNavigateToStats={handleNavigateToStats}
                                onStudySubScreenChange={setIsStudySubScreen}
                              />
                            }
                          />
                        )}
                      </CardsActionsContainer>
                    )
                  }}
                </CardsFlowContainer>
              )}
            </DecksActionsContainer>
          )}
        </DecksFlowContainer>
      )}
    </StudyFlowStateContainer>
  )
}
