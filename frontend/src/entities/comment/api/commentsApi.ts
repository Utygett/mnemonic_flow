// entities/comment/api/commentsApi.ts

import { apiRequest } from '@/shared/api/request'
import type { Comment, CreateCommentRequest } from '../model/types'

/**
 * Get all comments for a specific card level.
 * Comments are visible to all users (no authentication required).
 */
export async function getComments(cardId: string, levelId: string): Promise<Comment[]> {
  return apiRequest<Comment[]>(`/cards/${cardId}/levels/${levelId}/comments`)
}

/**
 * Create a new comment on a card level.
 * Requires authentication.
 */
export async function createComment(
  cardId: string,
  levelId: string,
  content: string
): Promise<Comment> {
  const payload: CreateCommentRequest = { content }
  return apiRequest<Comment>(`/cards/${cardId}/levels/${levelId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
