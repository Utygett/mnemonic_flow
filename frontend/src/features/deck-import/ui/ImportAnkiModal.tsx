import React, { useRef, useEffect } from 'react'
import { Upload, X, CheckCircle } from 'lucide-react'
import { useImportAnki } from '../model/useImportAnki'
import type { ImportAnkiResult } from '../api/importAnkiApi'
import styles from './ImportAnkiModal.module.css'

type Props = {
  open: boolean
  onClose: () => void
  onImportSuccess: (result: ImportAnkiResult) => void
}

export function ImportAnkiModal({ open, onClose, onImportSuccess }: Props) {
  const { importFile, importing, error, clearError } = useImportAnki()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    clearError()

    try {
      const result = await importFile(file)
      if (result) {
        onImportSuccess(result)
      }
    } catch {
      // Error is already handled by useImportAnki
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    if (!open) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return

    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={handleBackdrop}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>Import from Anki</h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
            disabled={importing}
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.uploadArea}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".apkg"
              onChange={handleFileSelect}
              disabled={importing}
              className={styles.fileInput}
            />
            <button
              type="button"
              className={styles.uploadBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              <Upload size={24} strokeWidth={2} />
              <span>Select .apkg file</span>
            </button>
          </div>

          {importing && (
            <div className={styles.status}>
              <div className={styles.spinner} />
              <p>Importing deck...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          <div className={styles.info}>
            <p className={styles.infoText}>
              Select an Anki deck package (.apkg) to import. The deck will be created with all its
              cards.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
