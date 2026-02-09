import React from 'react'
import { Search, PlusCircle, X } from 'lucide-react'

import styles from './AddDeckModal.module.css'

type Props = {
  onSearchPublic: () => void
  onCreateOwn: () => void
  onClose: () => void
}

export function AddDeckModal({ onSearchPublic, onCreateOwn, onClose }: Props) {
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  React.useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className={styles.backdrop} onClick={handleBackdrop}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>Добавить колоду</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.options}>
          <button
            type="button"
            className={styles.optionBtn}
            onClick={() => {
              onClose()
              onSearchPublic()
            }}
          >
            <div className={styles.optionIcon}>
              <Search size={22} strokeWidth={2} />
            </div>
            <div className={styles.optionText}>
              <div className={styles.optionTitle}>Найти колоду</div>
              <div className={styles.optionDesc}>Поиск среди публичных колод</div>
            </div>
          </button>

          <button
            type="button"
            className={styles.optionBtn}
            onClick={() => {
              onClose()
              onCreateOwn()
            }}
          >
            <div className={`${styles.optionIcon} ${styles.optionIconCreate}`}>
              <PlusCircle size={22} strokeWidth={2} />
            </div>
            <div className={styles.optionText}>
              <div className={styles.optionTitle}>Создать свою</div>
              <div className={styles.optionDesc}>Новая колода с нуля</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
