import React from 'react'

import type { EditDeckViewModel } from '../model/useEditDeckModel'

import styles from './EditDeckView.module.css'

type Props = EditDeckViewModel & {
  onCancel: () => void
}

export function EditDeckView(props: Props) {
  const {
    title,
    setTitle,
    description,
    setDescription,
    isPublic,
    setIsPublic,
    loading,
    saving,
    error,
    canSubmit,
    submit,
    onCancel,
  } = props

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingText}>Загрузка…</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>Редактировать колоду</h2>

          <label className={styles.field}>
            <div className={styles.fieldLabel}>Название</div>
            <input
              className={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Название колоды"
              maxLength={60}
              disabled={saving}
            />
          </label>

          <label className={styles.checkboxRow}>
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
              disabled={saving}
            />
            <span>Сделать колоду публичной</span>
          </label>

          <label className={styles.field}>
            <div className={styles.fieldLabel}>Описание</div>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Краткое описание (опционально)"
              disabled={saving}
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
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
