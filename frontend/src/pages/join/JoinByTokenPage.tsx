// Page that handles /join/:token invite links
import React, { useEffect, useState } from 'react'

import { deckEditorsApi } from '@/shared/api/deckEditors'
import { getErrorMessage } from '@/shared/lib/errors/getErrorMessage'

type Props = {
  token: string
}

export function JoinByTokenPage({ token }: Props) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [deckId, setDeckId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await deckEditorsApi.joinByToken(token)
        setDeckId(res.deck_id)
        setStatus('success')
      } catch (e) {
        setErrorMsg(getErrorMessage(e))
        setStatus('error')
      }
    })()
  }, [token])

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80, color: 'var(--color-text-secondary, #a6adc8)' }}>
        Активация приглашения…
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80, gap: 16 }}>
        <div style={{ fontSize: '2rem' }}>✅</div>
        <p style={{ color: 'var(--color-text-primary, #cdd6f4)', fontSize: '1.1rem' }}>
          Доступ редактора получен!
        </p>
        {deckId && (
          <button
            style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--color-primary, #cba6f7)', color: '#1e1e2e', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => {
              // Навигация без react-router — совместимо с AppRouter
              window.location.href = '/'
            }}
          >
            На главную
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80, gap: 12 }}>
      <div style={{ fontSize: '2rem' }}>❌</div>
      <p style={{ color: 'var(--color-error, #f38ba8)' }}>{errorMsg || 'Недействительная ссылка'}</p>
      <button
        style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--color-primary, #cba6f7)', color: '#1e1e2e', fontWeight: 600, cursor: 'pointer' }}
        onClick={() => { window.location.href = '/' }}
      >
        На главную
      </button>
    </div>
  )
}
