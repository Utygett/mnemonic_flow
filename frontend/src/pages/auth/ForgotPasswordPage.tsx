import React, { useState } from 'react'
import { Button } from '../../shared/ui/Button/Button'
import { Input } from '../../shared/ui/Input'

import styles from './ForgotPasswordPage.module.css'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const res = await fetch('/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (!res.ok) {
      setError(await res.text())
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Восстановление пароля</h1>
          <div className={styles.messageInfo}>
            Если email существует — ссылка для сброса отправлена.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Восстановление пароля</h1>

        {error && <div className={styles.messageError}>{error}</div>}

        <form onSubmit={submit} className={styles.form}>
          <Input
            value={email}
            onChange={setEmail}
            label="Email"
            placeholder="Введи свой email"
            type="email"
            required
          />

          <Button type="submit" variant="primary" size="large" fullWidth>
            Отправить ссылку
          </Button>
        </form>
      </div>
    </div>
  )
}
