import React, { useEffect, useRef, useState } from 'react'
import { Settings, User, Shield, LogOut } from 'lucide-react'

import type { ProfileViewProps } from '../model/types'

import styles from './ProfileView.module.css'

export function ProfileView(props: ProfileViewProps) {
  const { apiHealth, isPWA } = props

  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return
      const target = e.target as Node
      if (!menuRef.current) return
      if (!menuRef.current.contains(target)) setOpen(false)
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={styles.page}>
      <header className="page__header">
        <div className="page__header-inner profileHeader">
          <h1 className="page__title">Профиль</h1>

          <div className="profileHeader__right" ref={menuRef}>
            <button
              type="button"
              className="icon-btn"
              aria-label="Настройки"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpen(v => !v)}
            >
              <Settings size={18} />
            </button>

            {open && (
              <div className="dropdown" role="menu">
                <button
                  type="button"
                  className="dropdown__item"
                  role="menuitem"
                  onClick={() => alert('Подменю 1 (заглушка)')}
                >
                  <User size={16} />
                  Аккаунт (заглушка)
                </button>

                <button
                  type="button"
                  className="dropdown__item"
                  role="menuitem"
                  onClick={() => alert('Подменю 2 (заглушка)')}
                >
                  <Shield size={16} />
                  Безопасность (заглушка)
                </button>

                <div className="dropdown__sep" />

                <button
                  type="button"
                  className="dropdown__item dropdown__item--danger"
                  role="menuitem"
                  onClick={() => alert('Подменю 3 (заглушка)')}
                >
                  <LogOut size={16} />
                  Выйти (заглушка)
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={`${styles.main} container-centered`}>
        <div className="card">
          <div className="profileCard">
            <div className="avatar avatar--xl avatar--accent">{props.initials}</div>
            <div className="profileCard__meta">
              <div className="profileCard__name">{props.name}</div>
              <div className="profileCard__email">{props.email}</div>
            </div>
          </div>

          <div className="profileSection">
            <div className="profileSection__title">Состояние приложения</div>

            <div className="profileRow">
              <span className="profileRow__label">API статус</span>
              <span
                className={`profileRow__value ${apiHealth === 'healthy' ? 'text-ok' : 'text-bad'}`}
              >
                {apiHealth === 'healthy' ? '✓ Работает' : '✗ Ошибка'}
              </span>
            </div>

            <div className="profileRow">
              <span className="profileRow__label">Версия</span>
              <span className="profileRow__value">{props.version}</span>
            </div>

            <div className="profileRow">
              <span className="profileRow__label">Режим</span>
              <span className="profileRow__value text-accent">
                {isPWA ? 'Установлено как PWA' : 'Веб-версия'}
              </span>
            </div>

            <div className="profileRow">
              <span className="profileRow__label">Офлайн доступ</span>
              <span className={`profileRow__value ${isPWA ? 'text-ok' : 'text-warn'}`}>
                {isPWA ? 'Доступно' : 'Требуется установка'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
