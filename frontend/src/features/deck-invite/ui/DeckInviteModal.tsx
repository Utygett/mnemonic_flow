import React from 'react'

import { useDeckInviteModel } from '../model/useDeckInviteModel'
import styles from './DeckInviteModal.module.css'

type Props = {
  deckId: string
  onClose: () => void
}

export function DeckInviteModal({ deckId, onClose }: Props) {
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
  } = useDeckInviteModel({ deckId, onClose })

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Пригласить редактора</h2>
          <button className={styles.closeBtn} onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {/* QR + ссылка — показываем если инвайт уже создан */}
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
              <input
                className={styles.linkInput}
                readOnly
                value={invite.invite_url}
              />
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
              {loadingInvite ? 'Создание…' : 'Создать ссылку-приглашение'}
            </button>
          </>
        )}

        {/* Список текущих редакторов */}
        <div>
          <p className={styles.sectionTitle}>Редакторы</p>
          {loadingEditors ? (
            <div className={styles.emptyEditors}>Загрузка…</div>
          ) : editors.length === 0 ? (
            <div className={styles.emptyEditors}>Редакторов пока нет</div>
          ) : (
            editors.map(e => (
              <div key={e.user_id} className={styles.editorRow}>
                <span className={styles.editorEmail}>{e.username ?? e.email ?? e.user_id}</span>
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
      </div>
    </div>
  )
}
