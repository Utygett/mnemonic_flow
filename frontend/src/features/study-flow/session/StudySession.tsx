import React, { useEffect, useRef, useState } from 'react'

import { isMultipleChoice } from '../model/studyCardTypes'
import { StudyCard } from '../model/studyCardTypes'

import type { CardReviewInput, DifficultyRating } from '@/entities/card'
import type { CardSavedPayload } from '@/features/cards-edit/model/types'

import { FlipCard } from '../ui/FlipCard'
import { RatingButton } from '../ui/RatingButton'

import { Button } from '@/shared/ui/Button/Button'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { MarkdownView } from '@/shared/ui/MarkdownView'

import { X, SkipForward, Trash2, Pencil } from 'lucide-react'

import { EditCardModal } from '@/features/cards-edit/ui/EditCardModal'

import styles from './StudySession.module.css'

function getLevelIndex(l: any): number {
  return typeof l?.level_index === 'number' ? l.level_index : l?.levelindex
}

function nowIso() {
  return new Date().toISOString()
}

export function StudySession({
  cards,
  currentIndex,
  onRate,
  onClose,
  onLevelUp,
  onLevelDown,
  onSkip,
  onRemoveFromProgress,
  onCardSaved,
}: {
  cards: StudyCard[]
  currentIndex: number
  onRate: (review: CardReviewInput) => void
  onClose: () => void
  onLevelUp: () => void
  onLevelDown: () => void
  onSkip: () => void
  onRemoveFromProgress: () => void
  onCardSaved?: (payload: CardSavedPayload) => void
}) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const currentCard = cards[currentIndex]

  const shownAtRef = useRef<string | null>(null)
  const revealedAtRef = useRef<string | null>(null)

  if (!currentCard) {
    return (
      <div className={styles.studyPage}>
        <div className={`${styles.row} ${styles.rowCentered} ${styles.rowSpaceBetween}`}>
          <div className={styles.textMuted}>Карточки закончились</div>
        </div>
      </div>
    )
  }

  const progress = (currentIndex / cards.length) * 100

  const submitReview = (rating: DifficultyRating) => {
    const ratedAt = nowIso()

    const review: CardReviewInput = {
      rating,
      shownAt: shownAtRef.current ?? ratedAt,
      revealedAt: revealedAtRef.current ?? undefined,
      ratedAt,
    }

    setIsFlipped(false)
    setTimeout(() => onRate(review), 300)
  }

  const handleFlip = () => {
    // mark reveal moment on first reveal
    if (!isFlipped && !revealedAtRef.current) {
      revealedAtRef.current = nowIso()
    }
    setIsFlipped(v => !v)
  }

  const handleSkip = () => {
    setIsFlipped(false)
    onSkip()
  }

  const handleRemoveFromProgress = () => {
    const ok = window.confirm(
      'Удалить карточку из прогресса?\n\n' +
        'Она больше не будет отображаться в повторении. ' +
        'Вернуть её можно будет, начав изучение снова (прогресс начнётся заново).'
    )
    if (!ok) return

    setIsFlipped(false)
    onRemoveFromProgress()
  }

  useEffect(() => {
    setIsFlipped(false)
    setSelectedOptionId(null)

    // reset timing for new card/level (and after card edit)
    shownAtRef.current = nowIso()
    revealedAtRef.current = null
  }, [currentCard?.id, currentCard?.activeLevel, currentCard?.levels])

  const level =
    (currentCard.levels as any[]).find(l => getLevelIndex(l) === currentCard.activeLevel) ??
    currentCard.levels[0]

  const mcq = isMultipleChoice(currentCard) ? ((level as any)?.content as any) : null
  const timerSec = typeof mcq?.timerSec === 'number' && mcq.timerSec > 0 ? mcq.timerSec : 0

  useEffect(() => {
    if (!currentCard) return
    if (!isMultipleChoice(currentCard)) return
    if (isFlipped) {
      setTimeLeftMs(null)
      return
    }
    if (!timerSec) {
      setTimeLeftMs(null)
      return
    }

    const endAt = Date.now() + timerSec * 1000

    setTimeLeftMs(timerSec * 1000)

    const id = window.setInterval(() => {
      const left = endAt - Date.now()
      if (left <= 0) {
        window.clearInterval(id)
        setTimeLeftMs(0)
        // auto reveal
        if (!revealedAtRef.current) revealedAtRef.current = nowIso()
        setIsFlipped(true)
        return
      }
      setTimeLeftMs(left)
    }, 200)

    return () => window.clearInterval(id)
  }, [currentCard?.id, currentCard?.activeLevel, timerSec, isFlipped])

  const renderMcqFront = () => {
    const c = mcq
    if (!c) return null

    const correctId = String(c.correctOptionId ?? '')
    const showResult = selectedOptionId !== null
    const leftSec =
      timerSec > 0 ? Math.max(0, Math.ceil(((timeLeftMs ?? timerSec * 1000) as number) / 1000)) : 0

    const progressPct =
      timerSec > 0 && timeLeftMs != null
        ? Math.max(0, Math.min(100, (timeLeftMs / (timerSec * 1000)) * 100))
        : 100

    return (
      <div className={styles.mcq}>
        <div className={styles.mcqQuestionHeader}>
          <div className={styles.mcqQuestion}>
            <MarkdownView value={String(c.question ?? '')} />
          </div>
          <div className={styles.mcqQuestionDivider} />
        </div>

        <div className={styles.mcqOptionsScroll}>
          <div className={styles.mcqOptions}>
            {(c.options ?? []).map((opt: any) => {
              const optId = String(opt.id)

              const isSelected = selectedOptionId === optId
              const isCorrect = optId === correctId

              const optionClasses = [
                styles.mcqOption,
                isSelected ? styles.mcqOptionSelected : '',
                showResult && isCorrect ? styles.mcqOptionCorrect : '',
                showResult && isSelected && !isCorrect ? styles.mcqOptionWrong : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <button
                  key={optId}
                  type="button"
                  className={optionClasses}
                  disabled={showResult}
                  aria-pressed={isSelected}
                  onClick={e => {
                    e.stopPropagation()
                    setSelectedOptionId(optId)
                    if (!revealedAtRef.current) revealedAtRef.current = nowIso()
                    setIsFlipped(true)
                  }}
                >
                  <MarkdownView value={String(opt.text ?? '')} />
                </button>
              )
            })}
          </div>
        </div>

        {timerSec > 0 ? (
          <div className={styles.mcqTimer}>
            <div className={styles.mcqTimerText}>⏳ {leftSec}s</div>
            <div className={styles.mcqTimerBar}>
              <div className={styles.mcqTimerFill} style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  const renderMcqBack = () => {
    if (!mcq) return null

    const options: any[] = mcq.options ?? []
    const correctId = String(mcq.correctOptionId ?? '')

    const correct = options.find(o => String(o.id) === correctId)
    const selected = options.find(o => String(o.id) === String(selectedOptionId))

    const hasSelection = selectedOptionId != null && selected != null
    const isCorrectSelection = hasSelection && String(selectedOptionId) === correctId

    const noticeClasses = [
      styles.mcqBackNotice,
      hasSelection
        ? isCorrectSelection
          ? styles.mcqBackNoticeCorrect
          : styles.mcqBackNoticeWrong
        : styles.mcqBackNoticeMuted,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={styles.mcqBack}>
        <div className={noticeClasses}>
          {!hasSelection
            ? 'Ответ не выбран'
            : isCorrectSelection
              ? 'Вы выбрали правильный ответ'
              : 'Неправильно — ниже правильный ответ'}
        </div>

        {isCorrectSelection ? (
          <div className={`${styles.mcqBackBlock} ${styles.mcqBackBlockCorrect}`}>
            <div className={styles.mcqBackBlockTitle}>Правильный ответ</div>
            <MarkdownView value={String(correct?.text ?? '')} />
          </div>
        ) : (
          <>
            <div className={`${styles.mcqBackBlock} ${styles.mcqBackBlockCorrect}`}>
              <div className={styles.mcqBackBlockTitle}>Правильный ответ</div>
              <MarkdownView value={String(correct?.text ?? '')} />
            </div>

            {hasSelection ? (
              <div className={`${styles.mcqBackBlock} ${styles.mcqBackBlockWrong}`}>
                <div className={styles.mcqBackBlockTitle}>Вы выбрали</div>
                <MarkdownView value={String(selected?.text ?? '')} />
              </div>
            ) : null}
          </>
        )}

        {mcq.explanation ? (
          <div className={styles.mcqBackBlock}>
            <div className={styles.mcqBackBlockTitle}>Пояснение</div>
            <MarkdownView value={String(mcq.explanation)} />
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <div className={styles.studyPage}>
        <div className={`${styles.pageHeader} ${styles.headerPadding}`}>
          <div className={styles.pageHeaderInner}>
            <div
              className={`${styles.row} ${styles.rowSpaceBetween} ${styles.rowCentered} ${styles.marginBottom}`}
            >
              <button
                onClick={onClose}
                className={styles.iconBtn}
                aria-label="Закрыть сессию"
                type="button"
              >
                <X size={18} />
              </button>

              <span className={`${styles.textSmall} ${styles.textMuted}`}>
                {currentIndex + 1} / {cards.length}
              </span>

              <div className={`${styles.row} ${styles.rowCentered}`} style={{ columnGap: 32 }}>
                <button
                  onClick={() => setIsEditOpen(true)}
                  className={styles.iconBtn}
                  aria-label="Редактировать карточку"
                  type="button"
                >
                  <Pencil size={18} />
                </button>

                <button
                  onClick={handleSkip}
                  className={styles.iconBtn}
                  aria-label="Пропустить карточку"
                  type="button"
                >
                  <SkipForward size={18} />
                </button>

                <button
                  onClick={handleRemoveFromProgress}
                  className={styles.iconBtn}
                  aria-label="Удалить прогресс карточки"
                  type="button"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <ProgressBar progress={progress} color="#FF9A76" />
          </div>
        </div>

        <div className={styles.studyCardArea}>
          {isMultipleChoice(currentCard) ? (
            <FlipCard
              card={currentCard}
              isFlipped={isFlipped}
              onFlip={() => {
                if (!isFlipped && !revealedAtRef.current) revealedAtRef.current = nowIso()
                setIsFlipped(v => !v)
              }}
              disableFlipOnClick={!revealedAtRef.current}
              onLevelUp={onLevelUp}
              onLevelDown={onLevelDown}
              frontContent={renderMcqFront()}
              backContent={renderMcqBack()}
            />
          ) : (
            <FlipCard
              card={currentCard}
              isFlipped={isFlipped}
              onFlip={handleFlip}
              onLevelUp={onLevelUp}
              onLevelDown={onLevelDown}
            />
          )}
        </div>

        <div className={styles.studyActions}>
          {!isFlipped ? (
            <Button onClick={handleFlip} variant="primary" size="large" fullWidth>
              Показать ответ
            </Button>
          ) : (
            <div className={styles.studyActionsInner}>
              <div className={styles.ratingRow}>
                <RatingButton rating="again" label="Снова" onClick={() => submitReview('again')} />
                <RatingButton rating="hard" label="Трудно" onClick={() => submitReview('hard')} />
                <RatingButton rating="good" label="Хорошо" onClick={() => submitReview('good')} />
                <RatingButton rating="easy" label="Легко" onClick={() => submitReview('easy')} />
              </div>
            </div>
          )}
        </div>
      </div>

      <EditCardModal
        isOpen={isEditOpen}
        deckId={currentCard.deckId}
        cardId={currentCard.id}
        onClose={() => setIsEditOpen(false)}
        onSaved={payload => {
          onCardSaved?.(payload)
        }}
      />
    </>
  )
}
