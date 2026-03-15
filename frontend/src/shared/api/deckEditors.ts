// API client for deck editor invite endpoints

import { apiRequest } from './request'
import { addDeckToGroup } from '@/entities/group'

export interface InviteCreateResponse {
  token: string
  invite_url: string
  qr_base64: string
  invite_type: string
  expires_at: string | null
}

export interface EditorInfo {
  user_id: string
  email: string | null
  username: string | null
  invited_by: string
  created_at: string
}

export interface JoinResponse {
  detail: string
  deck_id: string
  deck_title: string
  invite_type: string // 'editor' | 'viewer'
}

export const deckEditorsApi = {
  createInvite(deckId: string, inviteType: 'editor' | 'viewer' = 'editor'): Promise<InviteCreateResponse> {
    return apiRequest<InviteCreateResponse>(`/decks/${deckId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ invite_type: inviteType }),
    })
  },

  joinByToken(token: string): Promise<JoinResponse> {
    return apiRequest<JoinResponse>(`/decks/join/${token}`, { method: 'POST' })
  },

  /** For viewer invites: after join, add deck to selected group */
  async addSharedDeckToGroup(deckId: string, groupId: string): Promise<void> {
    await addDeckToGroup(groupId, deckId)
  },

  listEditors(deckId: string): Promise<EditorInfo[]> {
    return apiRequest<EditorInfo[]>(`/decks/${deckId}/editors`)
  },

  removeEditor(deckId: string, editorUserId: string): Promise<void> {
    return apiRequest(`/decks/${deckId}/editors/${editorUserId}`, { method: 'DELETE' })
  },

  revokeInvite(deckId: string, token: string): Promise<void> {
    return apiRequest(`/decks/${deckId}/invite/${token}`, { method: 'DELETE' })
  },
}
