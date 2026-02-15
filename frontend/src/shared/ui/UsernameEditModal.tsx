import { useState } from 'react'
import { X } from 'lucide-react'
import styles from './UsernameEditModal.module.css'

type Props = {
  currentUsername: string
  isOpen: boolean
  onClose: () => void
  onSave: (username: string) => Promise<void>
}

export function UsernameEditModal({ currentUsername, isOpen, onClose, onSave }: Props) {
  const [username, setUsername] = useState(currentUsername)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmed = username.trim()
    if (!trimmed) {
      setError('Имя не может быть пустым')
      return
    }

    if (trimmed.length > 50) {
      setError('Имя не может быть длиннее 50 символов')
      return
    }

    setIsSaving(true)
    try {
      await onSave(trimmed)
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка сохранения'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setUsername(currentUsername)
    setError(null)
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Редактировать имя</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>
              Имя
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className={styles.input}
              placeholder="Введите ваше имя"
              maxLength={50}
              autoFocus
            />
            {error && <div className={styles.error}>{error}</div>}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleClose}
              disabled={isSaving}
            >
              Отмена
            </button>
            <button type="submit" className={styles.saveBtn} disabled={isSaving}>
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
