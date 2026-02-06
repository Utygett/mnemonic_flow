import React from 'react'
import type { StudyCard } from '../model/studyCardTypes'
import { motion } from 'motion/react'
import { MarkdownView } from '../../../shared/ui/MarkdownView'
import { ImageWithFallback } from '@/shared/ui/ImageWithFallback'
import { useAudioAutoplay } from '@/shared/ui/hooks/useAudioAutoplay'
import { getStoredAudioAutoplayMode } from '@/shared/model'

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

  // Media URLs are returned at the top level of the level object (camelCase from API)
  // Now they are arrays for multiple files
  const questionImageUrls = (level as any)?.questionImageUrls || []
  const answerImageUrls = (level as any)?.answerImageUrls || []
  const questionAudioUrls = (level as any)?.questionAudioUrls || []
  const answerAudioUrls = (level as any)?.answerAudioUrls || []

  const hasPrev = card.levels.some((l: any) => getLevelIndex(l) === card.activeLevel - 1)
  const hasNext = card.levels.some((l: any) => getLevelIndex(l) === card.activeLevel + 1)

  const canDown = hasPrev
  const canUp = hasNext

  // Get user's audio autoplay preference
  const autoplayMode = getStoredAudioAutoplayMode()

  // Auto-play question audio when card loads (front side)
  const questionAudio = useAudioAutoplay(questionAudioUrls, autoplayMode, !isFlipped, 0)

  // Auto-play answer audio when card is flipped to back
  // Add a small delay to let the flip animation start
  const answerAudio = useAudioAutoplay(answerAudioUrls, autoplayMode, isFlipped, 300)

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
            {questionImageUrls.length > 0 && (
              <div className={styles.cardImages}>
                {questionImageUrls.map((url: string, index: number) => (
                  <div key={index} className={styles.cardImage}>
                    <ImageWithFallback
                      src={url}
                      alt={`Question image ${index + 1}`}
                      className={styles.cardImageElement}
                    />
                  </div>
                ))}
              </div>
            )}
            {questionAudioUrls.length > 0 && (
              <div className={styles.cardAudios}>
                {questionAudioUrls.map((url: string, index: number) => (
                  <div key={index} className={styles.cardAudio}>
                    <audio
                      ref={el => questionAudio.registerAudioRef(index, el)}
                      src={url}
                      controls
                      className={styles.cardAudioElement}
                      onEnded={() => questionAudio.handleEnded(index)}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className={styles.flipcardText}>
              {frontContent ?? <MarkdownView value={frontText} />}
            </div>
            <div className={styles.flipcardHint}>Нажмите, чтобы увидеть ответ</div>
          </div>

          {/* Back */}
          <div className={`${styles.flipcardSide} ${styles.flipcardBack}`}>
            {answerImageUrls.length > 0 && (
              <div className={styles.cardImages}>
                {answerImageUrls.map((url: string, index: number) => (
                  <div key={index} className={styles.cardImage}>
                    <ImageWithFallback
                      src={url}
                      alt={`Answer image ${index + 1}`}
                      className={styles.cardImageElement}
                    />
                  </div>
                ))}
              </div>
            )}
            {answerAudioUrls.length > 0 && (
              <div className={styles.cardAudios}>
                {answerAudioUrls.map((url: string, index: number) => (
                  <div key={index} className={styles.cardAudio}>
                    <audio
                      ref={el => answerAudio.registerAudioRef(index, el)}
                      src={url}
                      controls
                      className={styles.cardAudioElement}
                      onEnded={() => answerAudio.handleEnded(index)}
                    />
                  </div>
                ))}
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

            {card.levels.length > 1 ? (
              <div className={styles.flipcardHint}>
                Уровень {card.activeLevel + 1} из {card.levels.length}
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
