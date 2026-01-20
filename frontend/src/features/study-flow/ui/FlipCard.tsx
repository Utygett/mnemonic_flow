import React from 'react'
import type { StudyCard } from '../model/studyCardTypes'
import { motion } from 'motion/react'
import { MarkdownView } from '../../../shared/ui/MarkdownView'

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
            <div className={styles.flipcardText}>
              {frontContent ?? <MarkdownView value={frontText} />}
            </div>
            <div className={styles.flipcardHint}>Нажмите, чтобы увидеть ответ</div>
          </div>

          {/* Back */}
          <div className={`${styles.flipcardSide} ${styles.flipcardBack}`}>
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
