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
      // если активная группа пропала (удалили/нет доступа) — сбрасываем
      const stillExists = s.activeGroupId ? groups.some(g => g.id === s.activeGroupId) : true
      const activeGroupId = stillExists ? s.activeGroupId : null
      if (!activeGroupId) localStorage.removeItem(LS_KEY)

      return { ...s, groups, activeGroupId }
    })
  }, [])

  const refreshDecks = useCallback(async () => {
    setState(s => ({ ...s, decksLoading: true, decksError: null }))

    try {
      // ВАЖНО:
      // - /groups/:id/decks/summary отдаёт корректные счетчики (repeat/for_repeat/completed/etc)
      // - /decks/ иногда возвращает "плоский" список без этих счетчиков (или с нулями)
      // Поэтому для дашборда при выбранной группе грузим summary по группе.
      const decks = state.activeGroupId
        ? await getGroupDecksSummary(state.activeGroupId)
        : await getUserDecks()

      setState(s => ({ ...s, decks, decksLoading: false, decksError: null }))
    } catch (e) {
      setState(s => ({ ...s, decks: [], decksLoading: false, decksError: e }))
    }
  }, [state.activeGroupId])

  // initial load
  useEffect(() => {
    void refreshGroups()
    void refreshDecks()
  }, [refreshDecks, refreshGroups])

  // reload decks when active group changes (so we can switch between /decks/ and /groups/:id/decks/summary)
  useEffect(() => {
    void refreshDecks()
  }, [state.activeGroupId, refreshDecks])

  // load deck ids for active group (used for filtering/highlighting)
  useEffect(() => {
    let cancelled = false

    async function run() {
      const groupId = state.activeGroupId
      if (!groupId) {
        setState(s => ({ ...s, currentGroupDeckIds: [] }))
        return
      }

      try {
        const groupDecks = await getGroupDecksSummary(groupId)
        if (cancelled) return
        setState(s => ({ ...s, currentGroupDeckIds: groupDecks.map(d => d.deck_id) }))
      } catch {
        // не блокируем UI — просто считаем, что для группы нет данных
        if (cancelled) return
        setState(s => ({ ...s, currentGroupDeckIds: [] }))
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [state.activeGroupId])

  const deleteActiveGroup = useCallback(async () => {
    const groupId = state.activeGroupId
    if (!groupId) return

    await deleteGroupApi(groupId)
    setActiveGroupId(null)
    await refreshGroups()
    // decks сами по себе не меняются, но обновить можно при желании
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
