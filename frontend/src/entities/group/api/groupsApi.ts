// Group API methods
import { apiRequest } from '@/shared/api/request'
import type { Group, UserGroupResponse, GroupCreatePayload } from '../model/types'
import type { PublicDeckSummary } from '@/entities/deck'

export async function getUserGroups(): Promise<Group[]> {
  const data = await apiRequest<UserGroupResponse[]>(`/groups/`)
  return data.map(g => ({
    id: g.user_group_id,
    title: g.title,
    description: g.description,
    parent_id: g.parent_id,
    kind: g.kind,
    source_group_id: g.source_group_id,
  }))
}

export async function getGroupDecksSummary(groupId: string): Promise<PublicDeckSummary[]> {
  return apiRequest<PublicDeckSummary[]>(`/groups/${groupId}/decks/summary`)
}

export async function createGroup(payload: GroupCreatePayload): Promise<Group> {
  return apiRequest<Group>(`/groups/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function deleteGroup(groupId: string): Promise<void> {
  return apiRequest<void>(`/groups/${groupId}`, { method: 'DELETE' })
}

export async function addDeckToGroup(groupId: string, deckId: string): Promise<void> {
  return apiRequest<void>(`/groups/${groupId}/decks/${deckId}`, {
    method: 'PUT',
  })
}

export async function removeDeckFromGroup(groupId: string, deckId: string): Promise<void> {
  return apiRequest<void>(`/groups/${groupId}/decks/${deckId}`, {
    method: 'DELETE',
  })
}
