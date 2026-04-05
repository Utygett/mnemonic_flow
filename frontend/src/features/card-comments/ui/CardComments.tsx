// features/card-comments/ui/CardComments.tsx

import { useState, useMemo } from 'react'
import { Trash2 } from 'lucide-react'

import { useCardComments } from '../model/useCardComments'
import styles from './CardComments.module.css'

interface CardCommentsProps {
  cardId: string
  levelId: string
  currentUserId?: string | null
  deckOwnerId?: string | null
}

function getCurrentUserId(): string | null {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return null
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload.sub ?? null
  } catch {
    return null
  }
}

export function CardComments({
  cardId,
  levelId,
  currentUserId: propUserId,
  deckOwnerId,
}: CardCommentsProps) {
  const { comments, loading, error, addComment, deleteComment } = useCardComments(cardId, levelId)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Use prop if provided, otherwise get from token
  const currentUserId = propUserId ?? getCurrentUserId()

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
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return 'Неверная дата'

    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    let relativeTime = ''
    if (diffMins < 1) relativeTime = 'только что'
    else if (diffMins < 60) relativeTime = `${diffMins} мин. назад`
    else if (diffHours < 24) relativeTime = `${diffHours} ч. назад`
    else if (diffDays < 7) relativeTime = `${diffDays} дн. назад`
    else relativeTime = d.toLocaleDateString()

    // Add exact time
    const hours = d.getHours().toString().padStart(2, '0')
    const minutes = d.getMinutes().toString().padStart(2, '0')
    const exactTime = `${hours}:${minutes}`

    return relativeTime === 'только что' ? exactTime : `${exactTime}, ${relativeTime}`
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>Комментарии</div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.form}>
        <textarea
          className={styles.textarea}
          placeholder="Добавить комментарий..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          enterKeyHint="enter"
          disabled={loading || submitting}
        />
        <div className={styles.formActions}>
          <button
            className={styles.sendButton}
            onClick={handleSubmit}
            disabled={!newComment.trim() || submitting || loading}
          >
            {submitting ? 'Отправка...' : 'Опубликовать комментарий'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Загрузка комментариев...</div>
      ) : comments.length === 0 ? (
        <div className={styles.emptyState}>Пока нет комментариев. Будьте первым!</div>
      ) : (
        <div className={styles.commentsList}>
          {comments.map(comment => {
            const isAuthor = currentUserId === comment.user_id
            const isDeckOwner = currentUserId === deckOwnerId
            const canDelete = isAuthor || isDeckOwner
            return (
              <div key={comment.id} className={styles.commentItem}>
                <div className={styles.commentHeader}>
                  <span className={styles.commentAuthor}>{comment.author_username}</span>
                  <div className={styles.commentHeaderRight}>
                    <span className={styles.commentDate} title={comment.created_at}>
                      {formatDate(comment.created_at)}
                    </span>
                    {canDelete && (
                      <button
                        className={styles.deleteButton}
                        onClick={() => {
                          if (window.confirm('Удалить комментарий?')) {
                            deleteComment(comment.id)
                          }
                        }}
                        aria-label="Удалить комментарий"
                        title="Удалить комментарий"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className={styles.commentContent}>{comment.content}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
