// API client for deck editor invite endpoints

import { apiRequest } from './request'

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
  group_title?: string | null // filled for viewer invites by backend
}

export const deckEditorsApi = {
  createInvite(
    deckId: string,
    inviteType: 'editor' | 'viewer' = 'editor'
  ): Promise<InviteCreateResponse> {
    return apiRequest<InviteCreateResponse>(`/decks/${deckId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ invite_type: inviteType }),
    })
  },

  /** Backend now handles group selection and deck insertion directly */
  joinByToken(token: string): Promise<JoinResponse> {
    return apiRequest<JoinResponse>(`/decks/join/${token}`, { method: 'POST' })
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
