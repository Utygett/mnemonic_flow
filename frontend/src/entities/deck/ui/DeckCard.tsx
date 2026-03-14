import React from 'react'
import { MoreVertical, Pencil, Trash2, FolderInput } from 'lucide-react'

import type { PublicDeckSummary } from '../model/types'

import styles from './DeckCard.module.css'

type Props = {
  deck: PublicDeckSummary
  onClick: () => void
  onDelete?: (deckId: string) => void
  onMove?: (deckId: string) => void
}

export function DeckCard({ deck, onClick, onDelete, onMove }: Props) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const description = deck.description?.trim()

  const totalCards = Number(deck.cards_count ?? 0)
  const completedCards = Number(deck.completed_cards_count ?? 0)
  const repetitionsCount = Number(deck.count_repeat ?? 0)
  const forRepetition = Number(deck.count_for_repeat ?? 0)

  const progress = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0

  React.useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const hasMenu = Boolean(onDelete || onMove)

  return (
    <div className={styles.root}>
      <button type="button" onClick={onClick} className={styles.clickArea}>
        <div className={styles.headerRow}>
          <div className={styles.title}>{deck.title}</div>
          {hasMenu && (
            <div ref={menuRef} className={styles.menuWrapper} onClick={e => e.stopPropagation()}>
              <button
                type="button"
                className={styles.menuButton}
                onClick={() => setMenuOpen(v => !v)}
                aria-label="Действия с колодой"
              >
                <MoreVertical size={16} />
              </button>

              {menuOpen && (
                <div className={styles.dropdown}>
                  {onMove && (
                    <button
                      type="button"
                      className={styles.dropdownItem}
                      onClick={() => {
                        setMenuOpen(false)
                        onMove(deck.deck_id)
                      }}
                    >
                      <FolderInput size={14} />
                      Переместить
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                      onClick={() => {
                        setMenuOpen(false)
                        onDelete(deck.deck_id)
                      }}
                    >
                      <Trash2 size={14} />
                      Удалить
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.descriptionBox}>
          <div className={styles.description}>
            {description ? description : 'Описание отсутствует'}
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.stat}>Прогресс: {progress}%</div>
          <div className={styles.stat}>Повторений: {repetitionsCount}</div>
          <div className={styles.stat}>Для повтора: {forRepetition}</div>
        </div>

        <div className={styles.progressWrap}>
          <div className={styles.progressBar} aria-label={`Прогресс ${progress}%`}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            <div className={styles.progressTextInBar}>
              {completedCards} / {totalCards}
            </div>
          </div>
        </div>
      </button>
    </div>
  )
}
