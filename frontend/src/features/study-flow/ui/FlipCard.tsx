import React from 'react'
import type { StudyCard } from '../model/studyCardTypes'
import { motion } from 'motion/react'
import { MarkdownView } from '../../../shared/ui/MarkdownView'
import { ImageWithFallback } from '@/shared/ui/ImageWithFallback'

import styles from './FlipCard.module.css'

interface FlipCardProps {
  card: StudyCard
  isFlipped: boolean
  onFlip: () => void

  onLevelUp?: () => void
  onLevelDown?: () => void

  frontContent?: React.ReactNode
  backContent?: React.ReactNode
  disableFlipOnClick?: boolean
}

function getLevelIndex(l: any): number {
  return typeof l?.level_index === 'number' ? l.level_index : l?.levelindex
}

export function FlipCard({
  card,
  isFlipped,
  onFlip,
  onLevelUp,
  onLevelDown,
  frontContent,
  backContent,
  disableFlipOnClick = false,
}: FlipCardProps) {
  const level =
    card.levels.find((l: any) => getLevelIndex(l) === card.activeLevel) ?? card.levels[0]

  const frontText = (level as any)?.content?.question || (card as any).title || '…'
  const backText = (level as any)?.content?.answer || '…'

  // Use level images if available, otherwise fall back to card images
  const questionImageUrl = (level as any)?.questionImageUrl || (card as any)?.questionImageUrl
  const answerImageUrl = (level as any)?.answerImageUrl || (card as any)?.answerImageUrl

  // Use level audio if available
  const questionAudioUrl = (level as any)?.questionAudioUrl
  const answerAudioUrl = (level as any)?.answerAudioUrl

  const hasPrev = card.levels.some((l: any) => getLevelIndex(l) === card.activeLevel - 1)
  const hasNext = card.levels.some((l: any) => getLevelIndex(l) === card.activeLevel + 1)

  const canDown = hasPrev
  const canUp = hasNext

  const handleClick = () => {
    if (disableFlipOnClick) return
    onFlip()
  }

  return (
    <div className={styles.flipcardContainer}>
      <motion.div className={styles.flipcard} onClick={handleClick} style={{ perspective: 1000 }}>
        <motion.div
          className={styles.flipcardInner}
          initial={false}
          animate={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {/* Front */}
          <div className={`${styles.flipcardSide} ${styles.flipcardFront}`}>
            {questionImageUrl && (
              <div className={styles.cardImage}>
                <ImageWithFallback
                  src={questionImageUrl}
                  alt="Question image"
                  className={styles.cardImageElement}
                />
              </div>
            )}
            {questionAudioUrl && (
              <div className={styles.cardAudio}>
                <audio src={questionAudioUrl} controls className={styles.cardAudioElement} />
              </div>
            )}
            <div className={styles.flipcardText}>
              {frontContent ?? <MarkdownView value={frontText} />}
            </div>
            <div className={styles.flipcardHint}>Нажмите, чтобы увидеть ответ</div>
          </div>

          {/* Back */}
          <div className={`${styles.flipcardSide} ${styles.flipcardBack}`}>
            {answerImageUrl && (
              <div className={styles.cardImage}>
                <ImageWithFallback
                  src={answerImageUrl}
                  alt="Answer image"
                  className={styles.cardImageElement}
                />
              </div>
            )}
            {answerAudioUrl && (
              <div className={styles.cardAudio}>
                <audio src={answerAudioUrl} controls className={styles.cardAudioElement} />
              </div>
            )}

            {(canDown || canUp) && (
              <div className={styles.flipcardLevelControls} onClick={e => e.stopPropagation()}>
                {canDown ? (
                  <button
                    type="button"
                    className={styles.flipcardLevelBtnLeft}
                    onClick={e => {
                      e.stopPropagation()
                      onLevelDown?.()
                    }}
                  >
                    &lt; проще
                  </button>
                ) : (
                  <div />
                )}

                {canUp ? (
                  <button
                    type="button"
                    className={styles.flipcardLevelBtnRight}
                    onClick={e => {
                      e.stopPropagation()
                      onLevelUp?.()
                    }}
                  >
                    сложнее &gt;
                  </button>
                ) : (
                  <div />
                )}
              </div>
            )}

            <div className={styles.flipcardText}>
              {backContent ?? <MarkdownView value={backText} />}
            </div>

            <div className={styles.flipcardHint}>
              Уровень {card.activeLevel + 1} из {card.levels.length}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
