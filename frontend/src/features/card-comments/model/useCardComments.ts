// features/card-comments/model/useCardComments.ts

import { useCallback, useEffect, useState } from 'react'

import { createComment, getComments } from '@/entities/comment'
import type { Comment } from '@/entities/comment'

interface UseCardCommentsResult {
  comments: Comment[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  addComment: (content: string) => Promise<Comment | null>
}

export function useCardComments(cardId: string, levelId: string): UseCardCommentsResult {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!cardId || !levelId) return

    setLoading(true)
    setError(null)
    try {
      const data = await getComments(cardId, levelId)
      setComments(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load comments')
    } finally {
      setLoading(false)
    }
  }, [cardId, levelId])

  const addComment = useCallback(
    async (content: string): Promise<Comment | null> => {
      if (!cardId || !levelId || !content.trim()) return null

      try {
        const newComment = await createComment(cardId, levelId, content.trim())
        // Add new comment at the beginning of the list
        setComments(prev => [newComment, ...prev])
        return newComment
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to add comment')
        return null
      }
    },
    [cardId, levelId]
  )

  useEffect(() => {
    refresh()
  }, [refresh])

  return { comments, loading, error, refresh, addComment }
}
