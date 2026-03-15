import React from 'react'

import type { DeckInviteMode } from '../model/types'
import { useDeckInviteModel } from '../model/useDeckInviteModel'
import styles from './DeckInviteModal.module.css'

type Props = {
  deckId: string
  mode: DeckInviteMode
  onClose: () => void
}

const TITLES: Record<DeckInviteMode, string> = {
  editor: 'Пригласить редактора',
  share: 'Поделиться колодой',
}

const BTN_LABELS: Record<DeckInviteMode, string> = {
  editor: 'Создать ссылку для редактора',
  share: 'Создать ссылку для добавления',
}

/** Show username if available, fall back to email, then to shortened user_id */
function formatEditor(username: string | null, email: string | null, userId: string): string {
  if (username && email) return `${username} (${email})`
  if (username) return username
  if (email) return email
  return userId.slice(0, 8) + '…'
}

export function DeckInviteModal({ deckId, mode, onClose }: Props) {
  const {
    invite,
    loadingInvite,
    inviteError,
    generateInvite,
    copyLink,
    copied,
    editors,
    loadingEditors,
    removeEditor,
  } = useDeckInviteModel({ deckId, mode, onClose })

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{TITLES[mode]}</h2>
          <button className={styles.closeBtn} onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {mode === 'share' && (
          <p className={styles.hint}>
            По этой ссылке другой пользователь сможет добавить колоду в свою группу.
          </p>
        )}

        {invite ? (
          <>
            <div className={styles.qrWrap}>
              <img
                className={styles.qrImg}
                src={`data:image/png;base64,${invite.qr_base64}`}
                alt="QR-код приглашения"
              />
            </div>
            <div className={styles.linkRow}>
              <input className={styles.linkInput} readOnly value={invite.invite_url} />
              <button className={styles.copyBtn} onClick={copyLink} type="button">
                {copied ? '✓ Скопировано' : 'Копировать'}
              </button>
            </div>
          </>
        ) : (
          <>
            {inviteError && <div className={styles.error}>{inviteError}</div>}
            <button
              className={styles.generateBtn}
              onClick={generateInvite}
              disabled={loadingInvite}
              type="button"
            >
              {loadingInvite ? 'Создание…' : BTN_LABELS[mode]}
            </button>
          </>
        )}

        {/* Список редакторов — только в режиме editor */}
        {mode === 'editor' && (
          <div>
            <p className={styles.sectionTitle}>Редакторы</p>
            {loadingEditors ? (
              <div className={styles.emptyEditors}>Загрузка…</div>
            ) : editors.length === 0 ? (
              <div className={styles.emptyEditors}>Редакторов пока нет</div>
            ) : (
              editors.map(e => (
                <div key={e.user_id} className={styles.editorRow}>
                  <div className={styles.editorInfo}>
                    {/* Show username + email together when both present */}
                    {e.username && (
                      <span className={styles.editorUsername}>{e.username}</span>
                    )}
                    {e.email && (
                      <span className={styles.editorEmail}>{e.email}</span>
                    )}
                    {!e.username && !e.email && (
                      <span className={styles.editorEmail}>{e.user_id.slice(0, 8)}…</span>
                    )}
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeEditor(e.user_id)}
                    type="button"
                  >
                    Удалить
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
