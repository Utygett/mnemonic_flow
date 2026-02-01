import React from 'react'

import type { CreateGroupViewModel } from '../model/useCreateGroupModel'

import styles from './CreateGroupView.module.css'

type Props = CreateGroupViewModel & {
  onCancel: () => void
}

export function CreateGroupView(props: Props) {
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
      <div className={`${styles.container} container-centered`}>
        <div className={styles.card}>
          <h2 className={styles.title}>Новая группа</h2>

          <label className={styles.field}>
            <div className={styles.fieldLabel}>Название</div>
            <input
              className={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Например: Мои колоды"
              maxLength={60}
              disabled={saving}
            />
          </label>

          <label className={styles.field}>
            <div className={styles.fieldLabel}>Описание</div>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Необязательно"
              rows={3}
              disabled={saving}
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button className={styles.btnGhost} onClick={onCancel} disabled={saving}>
              Отмена
            </button>
            <button className={styles.btnPrimary} onClick={submit} disabled={saving || !canSubmit}>
              {saving ? 'Сохранение…' : 'Создать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
