import { useEffect, useRef, useState } from 'react'
import { Settings, KeyRound, LogOut, Pencil, Sun, Moon, Volume2 } from 'lucide-react'

import type { ProfileViewProps, Theme } from '../model/types'
import type { AudioAutoplayMode } from '@/shared/model'
import {
  getAudioAutoplayModeLabel,
  setStoredAudioAutoplayMode,
  getStoredAudioAutoplayMode,
} from '@/shared/model'

import styles from './ProfileView.module.css'

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Светлая', icon: <Sun size={16} /> },
  { value: 'blue', label: 'Синяя', icon: <Moon size={16} /> },
  { value: 'dark', label: 'Тёмная', icon: <Moon size={16} /> },
]

const AUDIO_AUTOPLAY_OPTIONS: { value: AudioAutoplayMode; label: string }[] = [
  { value: 'all', label: 'Все файлы' },
  { value: 'first', label: 'Первый файл' },
  { value: 'disabled', label: 'Отключено' },
]

export function ProfileView(props: ProfileViewProps) {
  const {
    initials,
    name,
    email,
    version,
    theme,
    onThemeChange,
    onLogout,
    onChangePassword,
    onEditUsername,
  } = props

  const [open, setOpen] = useState(false)
  const [audioAutoplayMode, setAudioAutoplayMode] = useState<AudioAutoplayMode>(
    getStoredAudioAutoplayMode()
  )
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

  const handleLogout = () => {
    setOpen(false)
    onLogout()
  }

  const handleChangePassword = () => {
    setOpen(false)
    onChangePassword()
  }

  const handleAudioAutoplayChange = (mode: AudioAutoplayMode) => {
    setAudioAutoplayMode(mode)
    setStoredAudioAutoplayMode(mode)
  }

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
              <div className={styles.dropdown} role="menu">
                <button
                  type="button"
                  className={styles.dropdownItem}
                  role="menuitem"
                  onClick={handleChangePassword}
                >
                  <KeyRound size={16} />
                  Сменить пароль
                </button>

                <div className={styles.dropdownSep} />

                <button
                  type="button"
                  className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={`${styles.main} container-centered`}>
        <div className="card">
          {/* Profile Card */}
          <div className="profileCard">
            <div className="avatar avatar--xl avatar--accent">{initials}</div>
            <div className="profileCard__meta">
              <div className={styles.nameRow}>
                <span className="profileCard__name">{name}</span>
                <button
                  type="button"
                  className={styles.editBtn}
                  aria-label="Редактировать имя"
                  onClick={onEditUsername}
                >
                  <Pencil size={14} />
                </button>
              </div>
              <div className="profileCard__email">{email}</div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="profileSection">
            <div className="profileSection__title">Настройки</div>

            <div className="profileRow">
              <span className="profileRow__label">Тема</span>
              <div className={styles.themeSelector}>
                {THEME_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.themeBtn} ${theme === opt.value ? styles.themeBtnActive : ''}`}
                    onClick={() => onThemeChange(opt.value)}
                    aria-pressed={theme === opt.value}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="profileRow">
              <div className={styles.audioLabel}>
                <Volume2 size={16} />
                <span>Автовоспроизведение аудио</span>
              </div>
              <select
                className={styles.audioSelect}
                value={audioAutoplayMode}
                onChange={e => handleAudioAutoplayChange(e.target.value as AudioAutoplayMode)}
              >
                {AUDIO_AUTOPLAY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* App Info Section */}
          <div className="profileSection">
            <div className="profileSection__title">О приложении</div>

            <div className="profileRow">
              <span className="profileRow__label">Версия</span>
              <span className="profileRow__value">{version}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
