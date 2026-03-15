// Page that handles /join/:token invite links
import React, { useEffect, useState } from 'react'

import { deckEditorsApi, type JoinResponse } from '@/shared/api/deckEditors'
import { getUserGroups } from '@/entities/group'
import type { Group } from '@/entities/group'
import { getErrorMessage } from '@/shared/lib/errors/getErrorMessage'

type Props = {
  token: string
}

type PageState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'editor_success'; deckTitle: string }
  | { kind: 'pick_group'; deckId: string; deckTitle: string }
  | { kind: 'adding_group' }
  | { kind: 'share_success'; deckTitle: string }

export function JoinByTokenPage({ token }: Props) {
  const [state, setState] = useState<PageState>({ kind: 'loading' })
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      try {
        const res: JoinResponse = await deckEditorsApi.joinByToken(token)

        if (res.invite_type === 'viewer') {
          // Load groups so user can pick
          const userGroups = await getUserGroups()
          setGroups(userGroups)
          if (userGroups.length > 0) setSelectedGroupId(userGroups[0].id)
          setState({ kind: 'pick_group', deckId: res.deck_id, deckTitle: res.deck_title })
        } else {
          setState({ kind: 'editor_success', deckTitle: res.deck_title })
        }
      } catch (e) {
        setState({ kind: 'error', message: getErrorMessage(e) })
      }
    })()
  }, [token])

  const handleAddToGroup = async (deckId: string) => {
    if (!selectedGroupId) return
    setState({ kind: 'adding_group' })
    try {
      await deckEditorsApi.addSharedDeckToGroup(deckId, selectedGroupId)
      const deckTitle = state.kind === 'pick_group' ? state.deckTitle : ''
      setState({ kind: 'share_success', deckTitle })
    } catch (e) {
      setState({ kind: 'error', message: getErrorMessage(e) })
    }
  }

  const goHome = () => { window.location.href = '/' }

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 80,
    gap: 16,
    color: 'var(--color-text-primary, #cdd6f4)',
  }

  if (state.kind === 'loading' || state.kind === 'adding_group') {
    return (
      <div style={{ ...baseStyle }}>
        <div style={{ fontSize: '1.5rem' }}>⏳</div>
        <p>{state.kind === 'loading' ? 'Активация приглашения…' : 'Добавление колоды…'}</p>
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div style={{ ...baseStyle }}>
        <div style={{ fontSize: '2rem' }}>❌</div>
        <p style={{ color: 'var(--color-error, #f38ba8)' }}>{state.message || 'Недействительная ссылка'}</p>
        <Btn onClick={goHome}>На главную</Btn>
      </div>
    )
  }

  if (state.kind === 'editor_success') {
    return (
      <div style={{ ...baseStyle }}>
        <div style={{ fontSize: '2rem' }}>✅</div>
        <p style={{ fontWeight: 600 }}>Доступ редактора получен!</p>
        <p style={{ color: 'var(--color-text-secondary, #a6adc8)', fontSize: '0.9rem' }}>
          Колода: <b>{state.deckTitle}</b>
        </p>
        <Btn onClick={goHome}>На главную</Btn>
      </div>
    )
  }

  if (state.kind === 'share_success') {
    return (
      <div style={{ ...baseStyle }}>
        <div style={{ fontSize: '2rem' }}>✅</div>
        <p style={{ fontWeight: 600 }}>Колода добавлена!</p>
        <p style={{ color: 'var(--color-text-secondary, #a6adc8)', fontSize: '0.9rem' }}>
          <b>{state.deckTitle}</b> теперь в выбранной группе.
        </p>
        <Btn onClick={goHome}>На главную</Btn>
      </div>
    )
  }

  // pick_group
  const { deckId, deckTitle } = state
  return (
    <div style={{ ...baseStyle, maxWidth: 360, width: '100%', padding: '80px 16px 0' }}>
      <div style={{ fontSize: '2rem' }}>📚</div>
      <p style={{ fontWeight: 600, textAlign: 'center' }}>Вам поделились колодой</p>
      <p style={{ color: 'var(--color-text-secondary, #a6adc8)', fontSize: '0.9rem', textAlign: 'center' }}>
        <b>{deckTitle}</b>
      </p>

      <p style={{ alignSelf: 'flex-start', fontSize: '0.85rem', color: 'var(--color-text-secondary, #a6adc8)', marginBottom: 4 }}>
        Добавить в группу:
      </p>

      {groups.length === 0 ? (
        <p style={{ color: 'var(--color-error, #f38ba8)', fontSize: '0.9rem' }}>
          У вас нет групп. Сначала создайте группу на главном экране.
        </p>
      ) : (
        <select
          value={selectedGroupId}
          onChange={e => setSelectedGroupId(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--color-border, #45475a)',
            background: 'var(--color-surface, #313244)',
            color: 'var(--color-text-primary, #cdd6f4)',
            fontSize: '0.95rem',
          }}
        >
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.title}</option>
          ))}
        </select>
      )}

      <Btn onClick={() => handleAddToGroup(deckId)} disabled={!selectedGroupId}>
        Добавить колоду
      </Btn>
      <Btn onClick={goHome} secondary>На главную</Btn>
    </div>
  )
}

// Tiny inline button helper — no need for separate component
function Btn({
  children, onClick, disabled, secondary,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  secondary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      style={{
        padding: '10px 24px',
        borderRadius: 8,
        border: secondary ? '1px solid var(--color-border, #45475a)' : 'none',
        background: secondary ? 'transparent' : 'var(--color-primary, #cba6f7)',
        color: secondary ? 'var(--color-text-primary, #cdd6f4)' : '#1e1e2e',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: '100%',
      }}
    >
      {children}
    </button>
  )
}
