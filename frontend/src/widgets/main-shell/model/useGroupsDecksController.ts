import { useCallback, useEffect, useMemo, useState } from 'react'

import { getUserDecks } from '@/entities/deck'
import type { PublicDeckSummary } from '@/entities/deck'

import {
  deleteGroup as deleteGroupApi,
  getGroupDecksSummary,
  getUserGroups,
} from '@/entities/group'
import type { Group } from '@/entities/group'

type State = {
  groups: Group[]
  decks: PublicDeckSummary[]
  activeGroupId: string | null

  currentGroupDeckIds: string[]

  decksLoading: boolean
  decksError: unknown
}

const LS_KEY = 'active_group_id'

export function useGroupsDecksController() {
  const [state, setState] = useState<State>(() => ({
    groups: [],
    decks: [],
    activeGroupId: localStorage.getItem(LS_KEY) || null,
    currentGroupDeckIds: [],
    decksLoading: true,
    decksError: null,
  }))

  const setActiveGroupId = useCallback((groupId: string | null) => {
    setState(s => ({ ...s, activeGroupId: groupId }))
    if (groupId) localStorage.setItem(LS_KEY, groupId)
    else localStorage.removeItem(LS_KEY)
  }, [])

  const refreshGroups = useCallback(async () => {
    const groups = await getUserGroups()
    setState(s => {
      const stillExists = s.activeGroupId ? groups.some(g => g.id === s.activeGroupId) : true
      const activeGroupId = stillExists ? s.activeGroupId : null
      if (!activeGroupId) localStorage.removeItem(LS_KEY)

      return { ...s, groups, activeGroupId }
    })
  }, [])

  const refreshDecks = useCallback(async () => {
    setState(s => ({ ...s, decksLoading: true, decksError: null }))

    try {
      if (state.activeGroupId) {
        try {
          const decks = await getGroupDecksSummary(state.activeGroupId)
          setState(s => ({
            ...s,
            decks,
            currentGroupDeckIds: decks.map(d => d.deck_id),
            decksLoading: false,
            decksError: null,
          }))
        } catch (groupErr: any) {
          // If group not found (404), reset activeGroupId and fallback to all decks
          const status = groupErr?.status ?? groupErr?.response?.status
          if (status === 404) {
            console.warn('Active group not found, resetting to all decks')
            localStorage.removeItem(LS_KEY)
            setState(s => ({ ...s, activeGroupId: null }))
            const decks = await getUserDecks()
            setState(s => ({
              ...s,
              decks,
              currentGroupDeckIds: [],
              decksLoading: false,
              decksError: null,
            }))
          } else {
            throw groupErr
          }
        }
      } else {
        const decks = await getUserDecks()
        setState(s => ({
          ...s,
          decks,
          currentGroupDeckIds: [],
          decksLoading: false,
          decksError: null,
        }))
      }
    } catch (e) {
      setState(s => ({
        ...s,
        decks: [],
        currentGroupDeckIds: [],
        decksLoading: false,
        decksError: e,
      }))
    }
  }, [state.activeGroupId])

  useEffect(() => {
    void refreshGroups()
    void refreshDecks()
  }, [refreshDecks, refreshGroups])

  useEffect(() => {
    void refreshDecks()
  }, [state.activeGroupId, refreshDecks])

  const deleteActiveGroup = useCallback(async () => {
    const groupId = state.activeGroupId
    if (!groupId) return

    await deleteGroupApi(groupId)
    setActiveGroupId(null)
    await refreshGroups()
  }, [refreshGroups, setActiveGroupId, state.activeGroupId])

  const result = useMemo(
    () => ({
      groups: state.groups,
      activeGroupId: state.activeGroupId,
      setActiveGroupId,

      decks: state.decks,
      decksLoading: state.decksLoading,
      decksError: state.decksError,
      refreshDecks,

      refreshGroups,
      deleteActiveGroup,

      currentGroupDeckIds: state.currentGroupDeckIds,
    }),
    [
      deleteActiveGroup,
      refreshDecks,
      refreshGroups,
      setActiveGroupId,
      state.activeGroupId,
      state.currentGroupDeckIds,
      state.decks,
      state.decksError,
      state.decksLoading,
      state.groups,
    ]
  )

  return result
}
