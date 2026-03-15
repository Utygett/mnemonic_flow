// API client for deck editor invite endpoints

import { apiRequest } from './request'

export interface InviteCreateResponse {
  token: string
  invite_url: string
  qr_base64: string
  expires_at: string | null
}

export interface EditorInfo {
  user_id: string
  email: string | null
  username: string | null
  invited_by: string
  created_at: string
}

export const deckEditorsApi = {
  createInvite(deckId: string): Promise<InviteCreateResponse> {
    return apiRequest<InviteCreateResponse>(`/decks/${deckId}/invite`, { method: 'POST' })
  },

  joinByToken(token: string): Promise<{ detail: string; deck_id: string }> {
    return apiRequest(`/decks/join/${token}`, { method: 'POST' })
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
