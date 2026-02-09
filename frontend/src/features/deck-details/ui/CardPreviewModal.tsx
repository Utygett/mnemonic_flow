import React from 'react'
import { X, Pencil, CheckCircle } from 'lucide-react'

import type { ApiCard } from '@/entities/deck'
import { Button } from '@/shared/ui/Button/Button'

import styles from './CardPreviewModal.module.css'

type Props = {
  card: ApiCard
  canEdit: boolean
  onEdit: (cardId: string) => void
  onClose: () => void
}

type McqOption = { id: string; text: string; is_correct?: boolean; image_url?: string }

function extractCardData(card: ApiCard) {
  const level = card.levels?.[0]
  const content = (level?.content ?? {}) as Record<string, unknown>

  const question = (content.question as string) || card.title || ''
  const answer = (content.answer as string) || ''
  const explanation = (content.explanation as string) || ''
  const options = (content.options as McqOption[] | undefined) ?? []
  const correctIds = (content.correct_option_ids as string[] | undefined) ?? []

  const cardAny = card as Record<string, unknown>
  const typeField = card.card_type || (cardAny.type as string) || ''
  const isMultipleChoice = typeField === 'multiple_choice' || options.length > 0

  return { question, answer, explanation, options, correctIds, isMultipleChoice }
}

export function CardPreviewModal({ card, canEdit, onEdit, onClose }: Props) {
  const { question, answer, explanation, options, correctIds, isMultipleChoice } =
    extractCardData(card)

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll
  React.useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>Просмотр карточки</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <div className={styles.label}>Вопрос</div>
            <div className={styles.text}>{question || '—'}</div>
          </div>

          {isMultipleChoice && options.length > 0 ? (
            <div className={styles.section}>
              <div className={styles.label}>Варианты ответа</div>
              <div className={styles.optionsList}>
                {options.map(opt => {
                  const isCorrect = correctIds.includes(opt.id) || (opt as any).is_correct
                  return (
                    <div
                      key={opt.id}
                      className={
                        isCorrect ? `${styles.option} ${styles.optionCorrect}` : styles.option
                      }
                    >
                      {isCorrect && <CheckCircle size={14} strokeWidth={2} />}
                      <span>{opt.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className={styles.section}>
              <div className={styles.label}>Ответ</div>
              <div className={styles.text}>{answer || '—'}</div>
            </div>
          )}

          {explanation && (
            <div className={styles.section}>
              <div className={styles.label}>Пояснение</div>
              <div className={styles.textMuted}>{explanation}</div>
            </div>
          )}
        </div>

        {canEdit && (
          <div className={styles.footer}>
            <Button variant="primary" size="medium" fullWidth onClick={() => onEdit(card.card_id)}>
              <Pencil size={16} strokeWidth={2} />
              Редактировать
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
