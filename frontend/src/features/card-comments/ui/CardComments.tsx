// features/card-comments/ui/CardComments.tsx

import { useState } from 'react'

import { useCardComments } from '../model/useCardComments'
import styles from './CardComments.module.css'

interface CardCommentsProps {
  cardId: string
  levelId: string
}

export function CardComments({ cardId, levelId }: CardCommentsProps) {
  const { comments, loading, error, addComment } = useCardComments(cardId, levelId)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    try {
      await addComment(newComment)
      setNewComment('')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    console.log('Date string:', dateString)
    const d = new Date(dateString)
    console.log('Parsed date:', d, 'isValid:', !isNaN(d.getTime()))
    if (isNaN(d.getTime())) return 'Invalid Date'

    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return d.toLocaleDateString()
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>Comments</div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.form}>
        <textarea
          className={styles.textarea}
          placeholder="Add a comment..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          disabled={loading || submitting}
        />
        <div className={styles.formActions}>
          <button
            className={styles.sendButton}
            onClick={handleSubmit}
            disabled={!newComment.trim() || submitting || loading}
          >
            {submitting ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className={styles.emptyState}>No comments yet. Be the first!</div>
      ) : (
        <div className={styles.commentsList}>
          {comments.map(comment => (
            <div key={comment.id} className={styles.commentItem}>
              <div className={styles.commentHeader}>
                <span className={styles.commentAuthor}>{comment.author_username}</span>
                <span className={styles.commentDate}>{formatDate(comment.created_at)}</span>
              </div>
              <div className={styles.commentContent}>{comment.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
