import React, { useEffect, useState } from 'react'
import { Button } from '../../shared/ui/Button/Button'
import { Input } from '../../shared/ui/Input'

import styles from './ResetPasswordPage.module.css'

export function ResetPasswordPage({ token }: { token: string }) {
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [secondsLeft, setSecondsLeft] = useState(5)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStatus('idle')

    if (!token) {
      setStatus('error')
      setError('Токен не найден в ссылке')
      return
    }

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: password }),
    })

    if (!res.ok) {
      let msg = 'Ошибка'
      try {
        msg = (await res.json()).detail ?? msg
      } catch {}
      setError(msg)
      setStatus('error')
      return
    }

    setStatus('ok')
  }

  useEffect(() => {
    if (status !== 'ok') return

    setSecondsLeft(5)

    const intervalId = window.setInterval(() => {
      setSecondsLeft(s => (s > 0 ? s - 1 : 0))
    }, 1000)

    const timeoutId = window.setTimeout(() => {
      window.location.hash = '/'
    }, 5000)

    return () => {
      clearInterval(intervalId)
      clearTimeout(timeoutId)
    }
  }, [status])

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Сброс пароля</h1>
          <div className={styles.messageError}>Токен не найден в ссылке</div>
        </div>
      </div>
    )
  }

  if (status === 'ok') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Пароль изменён</h1>
          <div className={styles.messageInfo}>Перенаправление на вход через {secondsLeft} сек…</div>
          <a href="/" className={styles.linkBtn}>
            Перейти на вход сейчас
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Новый пароль</h1>

        {error && <div className={styles.messageError}>{error}</div>}

        <form onSubmit={submit} className={styles.form}>
          <Input
            type="password"
            value={password}
            onChange={setPassword}
            label="Новый пароль"
            placeholder="Введите новый пароль"
            required
          />

          <Button type="submit" variant="primary" size="large" fullWidth>
            Сохранить
          </Button>
        </form>
      </div>
    </div>
  )
}
