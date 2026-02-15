import React from 'react'

import type { CreateDeckViewModel } from '../model/useCreateDeckModel'

import styles from './CreateDeckView.module.css'

type Props = CreateDeckViewModel & {
  onCancel: () => void
}

export function CreateDeckView(props: Props) {
  const {
    title,
    setTitle,
    description,
    setDescription,
    saving,
    error,
    canSubmit,
    submit,
    onCancel,
  } = props

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>Новая колода</h2>

          <label className={styles.field}>
            <div className={styles.fieldLabel}>Название</div>
            <input
              className={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Например: Английские слова"
              maxLength={60}
              disabled={saving}
            />
          </label>

          <label className={styles.field}>
            <div className={styles.fieldLabel}>Описание</div>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Для чего эта колода, какие темы покрывает, и т.д."
              maxLength={500}
              disabled={saving}
              rows={4}
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button className={styles.btnGhost} onClick={onCancel} disabled={saving} type="button">
              Отмена
            </button>
            <button
              className={styles.btnPrimary}
              onClick={submit}
              disabled={saving || !canSubmit}
              type="button"
            >
              {saving ? 'Сохранение…' : 'Создать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
