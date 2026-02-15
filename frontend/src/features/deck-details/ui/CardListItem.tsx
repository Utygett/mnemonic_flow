import React from 'react'
import { Pencil, Image, Volume2 } from 'lucide-react'

import type { ApiCard } from '@/entities/deck'

import styles from './CardListItem.module.css'

type Props = {
  card: ApiCard
  canEdit: boolean
  onEdit: (cardId: string) => void
  onClick?: () => void
}

const MAX_TEXT = 80
const MAX_OPTION = 60

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

type McqOption = { id: string; text: string; image_url?: string }

function extractContent(card: ApiCard) {
  const level = card.levels?.[0]
  const content = (level?.content ?? {}) as Record<string, unknown>

  const question = (content.question as string) || ''
  const options = (content.options as McqOption[] | undefined) ?? []

  const cardAny = card as Record<string, unknown>
  const typeField = card.card_type || (cardAny.type as string) || ''
  const isMultipleChoice = typeField === 'multiple_choice' || options.length > 0

  // Media detection
  const raw = level as Record<string, unknown> | undefined
  const hasImages =
    ((raw?.question_image_urls as string[])?.length ?? 0) > 0 ||
    ((raw?.answer_image_urls as string[])?.length ?? 0) > 0 ||
    !!(content.question_image_url || content.answer_image_url) ||
    options.some(o => !!o.image_url)

  const hasAudio =
    ((raw?.question_audio_urls as string[])?.length ?? 0) > 0 ||
    ((raw?.answer_audio_urls as string[])?.length ?? 0) > 0

  return { question, isMultipleChoice, options, hasImages, hasAudio }
}

export function CardListItem({ card, canEdit, onEdit, onClick }: Props) {
  const { question, isMultipleChoice, options, hasImages, hasAudio } = extractContent(card)

  const title = card.title || question || 'Карточка'

  return (
    <div
      className={`${styles.item} ${onClick ? styles.itemClickable : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <span className={styles.title}>{truncate(title, MAX_TEXT)}</span>
          <span
            className={
              isMultipleChoice ? `${styles.typeBadge} ${styles.typeBadgeMcq}` : styles.typeBadge
            }
          >
            {isMultipleChoice ? 'Тест' : 'Flash-card'}
          </span>
        </div>

        {question && question !== title && (
          <div className={styles.question}>{truncate(question, MAX_TEXT)}</div>
        )}

        {isMultipleChoice && options.length > 0 && (
          <div className={styles.optionsList}>
            {options.map(opt => (
              <div key={opt.id} className={styles.option}>
                <span>{truncate(opt.text, MAX_OPTION)}</span>
              </div>
            ))}
          </div>
        )}

        {(hasImages || hasAudio) && (
          <div className={styles.mediaBadges}>
            {hasImages && (
              <span className={styles.badge}>
                <Image size={13} strokeWidth={2} />
                Фото
              </span>
            )}
            {hasAudio && (
              <span className={styles.badge}>
                <Volume2 size={13} strokeWidth={2} />
                Аудио
              </span>
            )}
          </div>
        )}
      </div>

      {canEdit && (
        <button
          type="button"
          className={styles.editBtn}
          onClick={e => {
            e.stopPropagation()
            onEdit(card.card_id)
          }}
          aria-label="Редактировать карточку"
        >
          <Pencil size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}
