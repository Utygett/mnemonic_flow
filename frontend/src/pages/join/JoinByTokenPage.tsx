// Page that handles /join/:token invite links
import React, { useEffect, useState } from 'react'

import { deckEditorsApi, type JoinResponse } from '@/shared/api/deckEditors'
import { getErrorMessage } from '@/shared/lib/errors/getErrorMessage'

type Props = {
  token: string
}

type PageState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'editor_success'; deckTitle: string }
  | { kind: 'share_success'; deckTitle: string; groupTitle: string }

export function JoinByTokenPage({ token }: Props) {
  const [state, setState] = useState<PageState>({ kind: 'loading' })

  useEffect(() => {
    ;(async () => {
      try {
        const res: JoinResponse = await deckEditorsApi.joinByToken(token)

        if (res.invite_type === 'viewer') {
          setState({
            kind: 'share_success',
            deckTitle: res.deck_title,
            groupTitle: res.group_title ?? 'Мои колоды',
          })
        } else {
          setState({ kind: 'editor_success', deckTitle: res.deck_title })
        }
      } catch (e) {
        setState({ kind: 'error', message: getErrorMessage(e) })
      }
    })()
  }, [token])

  const goHome = () => {
    window.location.href = '/'
  }

  const base: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 80,
    gap: 16,
    color: 'var(--color-text-primary, #cdd6f4)',
  }

  if (state.kind === 'loading') {
    return (
      <div style={base}>
        <div style={{ fontSize: '1.5rem' }}>⏳</div>
        <p>Активация приглашения…</p>
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div style={base}>
        <div style={{ fontSize: '2rem' }}>❌</div>
        <p style={{ color: 'var(--color-error, #f38ba8)', textAlign: 'center' }}>
          {state.message || 'Недействительная ссылка'}
        </p>
        <Btn onClick={goHome}>На главную</Btn>
      </div>
    )
  }

  if (state.kind === 'editor_success') {
    return (
      <div style={base}>
        <div style={{ fontSize: '2rem' }}>✅</div>
        <p style={{ fontWeight: 600 }}>Доступ редактора получен!</p>
        <p
          style={{
            color: 'var(--color-text-secondary, #a6adc8)',
            fontSize: '0.9rem',
            textAlign: 'center',
          }}
        >
          Колода: <b>{state.deckTitle}</b>
        </p>
        <Btn onClick={goHome}>На главную</Btn>
      </div>
    )
  }

  // share_success
  return (
    <div style={base}>
      <div style={{ fontSize: '2rem' }}>✅</div>
      <p style={{ fontWeight: 600 }}>Колода добавлена!</p>
      <p
        style={{
          color: 'var(--color-text-secondary, #a6adc8)',
          fontSize: '0.9rem',
          textAlign: 'center',
        }}
      >
        <b>{state.deckTitle}</b> добавлена в группу «{state.groupTitle}».
      </p>
      <Btn onClick={goHome}>На главную</Btn>
    </div>
  )
}

function Btn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        padding: '10px 32px',
        borderRadius: 8,
        border: 'none',
        background: 'var(--color-primary, #cba6f7)',
        color: '#1e1e2e',
        fontWeight: 600,
        cursor: 'pointer',
        minWidth: 160,
      }}
    >
      {children}
    </button>
  )
}
