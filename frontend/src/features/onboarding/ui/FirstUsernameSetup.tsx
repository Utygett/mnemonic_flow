import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import styles from './FirstUsernameSetup.module.css'

type Props = {
  initialUsername: string
  onComplete: (username: string) => Promise<void>
}

export function FirstUsernameSetup({ initialUsername, onComplete }: Props) {
  const [username, setUsername] = useState(initialUsername)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmed = username.trim()
    if (!trimmed) {
      setError('Пожалуйста, введите ваше имя')
      return
    }

    if (trimmed.length > 50) {
      setError('Имя не может быть длиннее 50 символов')
      return
    }

    setIsSubmitting(true)
    try {
      await onComplete(trimmed)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка сохранения'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <Sparkles size={32} className={styles.icon} />
        </div>

        <h1 className={styles.title}>Добро пожаловать!</h1>

        <p className={styles.description}>
          Представьтесь, пожалуйста. Как мы можем к вам обращаться?
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className={styles.input}
              placeholder="Ваше имя"
              maxLength={50}
              autoFocus
              disabled={isSubmitting}
            />
            {error && <div className={styles.error}>{error}</div>}
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting || !username.trim()}
          >
            {isSubmitting ? 'Сохранение...' : 'Продолжить'}
          </button>
        </form>
      </div>
    </div>
  )
}
