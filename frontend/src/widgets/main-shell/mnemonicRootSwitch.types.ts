import type { MainTab } from './mainShell.types'

import type { CardsFlowApi } from '../../features/cards-flow'
import type { CardsActionsApi } from '../../features/cards-actions'

import type { DecksFlowApi } from '../../features/decks-flow'
import type { DecksActionsApi } from '../../features/decks-actions'

export type MnemonicRootSwitchProps = {
  study: any
  activeTab: MainTab
  isPWA: boolean

  cards: {
    flow: CardsFlowApi
    actions: CardsActionsApi
  }

  decks: {
    flow: DecksFlowApi
    actions: DecksActionsApi
  }

  data: {
    decks: any[]
    groups: any[]
    activeGroupId: string | null
    currentGroupDeckIds: string[]
    statistics: any
    dashboardStats: any
  }

  status: {
    decksLoading: boolean
    statsLoading: boolean
    decksError: any
    statsError: any
  }

  refresh: {
    refreshGroups: () => Promise<void>
    refreshDecks: () => Promise<void>
    refreshStats: () => Promise<void>
  }

  groupsActions: {
    setActiveGroupId: (id: string | null) => void
    deleteActiveGroup: () => Promise<void>
  }

  onStudySubScreenChange?: (isSubScreen: boolean) => void
}
