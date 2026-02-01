// src/shared/lib/hooks/useGroupsDecksController.ts
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import { useDecks } from './useDecks'
import { getUserGroups, deleteGroup } from '@/entities/group'
import type { Group } from '@/entities/group'

type UseDecksReturn = ReturnType<typeof useDecks>

export type GroupsDecksController = {
  groups: Group[]
  activeGroupId: string | null
  setActiveGroupId: Dispatch<SetStateAction<string | null>>

  decks: UseDecksReturn['decks']
  decksLoading: UseDecksReturn['loading']
  decksError: UseDecksReturn['error']
  refreshDecks: UseDecksReturn['refresh']

  refreshGroups: () => Promise<void>
  deleteActiveGroup: () => Promise<void>

  currentGroupDeckIds: string[]
}

export function useGroupsDecksController(): GroupsDecksController {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(() => {
    const v = localStorage.getItem('active_group_id')
    if (!v || v === 'null' || v === 'undefined' || v.trim() === '') return null
    return v
  })

  const [groups, setGroups] = useState<Group[]>([])

  const refreshGroups = useCallback(async (): Promise<void> => {
    const gs = await getUserGroups()
    setGroups(gs)

    setActiveGroupId(prev => {
      if (prev && gs.some(g => g.id === prev)) return prev

      const stored = localStorage.getItem('active_group_id')
      if (stored && gs.some(g => g.id === stored)) return stored

      return gs[0]?.id ?? null
    })
  }, [])

  useEffect(() => {
    refreshGroups().catch(console.error)
  }, [refreshGroups])

  useEffect(() => {
    if (activeGroupId) localStorage.setItem('active_group_id', activeGroupId)
    else localStorage.removeItem('active_group_id')
  }, [activeGroupId])

  const {
    decks,
    loading: decksLoading,
    error: decksError,
    refresh: refreshDecks,
  } = useDecks(activeGroupId)

  const currentGroupDeckIds = useMemo(() => decks.map((d: any) => d.deck_id), [decks])

  const deleteActiveGroup = useCallback(async (): Promise<void> => {
    if (!activeGroupId) return

    const g = groups.find(x => x.id === activeGroupId)
    const ok = window.confirm(
      `Удалить группу "${g?.title ?? 'без названия'}"? Это действие нельзя отменить.`
    )
    if (!ok) return

    try {
      await deleteGroup(activeGroupId)
      await refreshGroups()
    } catch (e) {
      console.error(e)
      alert('Не удалось удалить группу')
    }
  }, [activeGroupId, groups, refreshGroups])

  return {
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
  }
}
