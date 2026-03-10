import React from 'react'
import { X } from 'lucide-react'

import { useEditDeckModel } from '@/features/deck-edit'
import { EditDeckForm } from '@/features/deck-edit'

import styles from './EditDeckModal.module.css'

type Props = {
  deckId: string
  onClose: () => void
  onSaved: () => void
}

export function EditDeckModal({ deckId, onClose, onSaved }: Props) {
  const vm = useEditDeckModel({ deckId, onCancel: onClose, onSaved })

  const handleBackdropClick = (e: React.MouseEvent) => {
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
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>Редактировать колоду</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            <X size={20} strokeWidth={2} />
          </button>
        </div>
        <div className={styles.content}>
          <EditDeckForm {...vm} onCancel={onClose} />
        </div>
      </div>
    </div>
  )
}
