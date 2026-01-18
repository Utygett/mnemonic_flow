import React from 'react';
import type { StudyCard } from '../model/studyCardTypes';
import { motion } from 'motion/react';
import { MarkdownView } from '../../../shared/ui/MarkdownView';

interface FlipCardProps {
  card: StudyCard;
  isFlipped: boolean;
  onFlip: () => void;

  onLevelUp?: () => void;
  onLevelDown?: () => void;

  frontContent?: React.ReactNode;
  backContent?: React.ReactNode;
  disableFlipOnClick?: boolean;
}

function getLevelIndex(l: any): number {
  return typeof l?.level_index === 'number' ? l.level_index : l?.levelindex;
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
    card.levels.find((l: any) => getLevelIndex(l) === card.activeLevel) ?? card.levels[0];

  const frontText = (level as any)?.content?.question || (card as any).title || '…';
  const backText = (level as any)?.content?.answer || '…';

  const hasPrev = card.levels.some((l: any) => getLevelIndex(l) === card.activeLevel - 1);
  const hasNext = card.levels.some((l: any) => getLevelIndex(l) === card.activeLevel + 1);

  const canDown = hasPrev;
  const canUp = hasNext;

  const handleClick = () => {
    if (disableFlipOnClick) return;
    onFlip();
  };

  return (
    <div className="flipcard-container">
      <motion.div className="flipcard" onClick={handleClick} style={{ perspective: 1000 }}>
        <motion.div
          className="flipcard__inner"
          initial={false}
          animate={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {/* Front */}
          <div className="flipcard__side flipcard__front">
            <div className="flipcard__text">{frontContent ?? <MarkdownView value={frontText} />}</div>
            <div className="flipcard__hint">Нажмите, чтобы увидеть ответ</div>
          </div>

          {/* Back */}
          <div className="flipcard__side flipcard__back">
            {(canDown || canUp) && (
              <div className="flipcard__level-controls" onClick={(e) => e.stopPropagation()}>
                {canDown ? (
                  <button
                    type="button"
                    className="flipcard__level-btn flipcard__level-btn--left"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLevelDown?.();
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
                    className="flipcard__level-btn flipcard__level-btn--right"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLevelUp?.();
                    }}
                  >
                    сложнее &gt;
                  </button>
                ) : (
                  <div />
                )}
              </div>
            )}

            <div className="flipcard__text">{backContent ?? <MarkdownView value={backText} />}</div>

            <div className="flipcard__hint">
              Уровень {card.activeLevel + 1} из {card.levels.length}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
