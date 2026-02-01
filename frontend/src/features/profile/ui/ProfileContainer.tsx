import { useState } from 'react'

import { ProfileView } from './ProfileView'
import type { Theme } from '../model/types'

export function ProfileContainer() {
  const [theme, setTheme] = useState<Theme>('dark')

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.href = '/auth'
  }

  const handleChangePassword = () => {
    alert('Смена пароля (заглушка)')
  }

  const handleEditUsername = () => {
    alert('Редактирование имени (заглушка)')
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    // TODO: persist to localStorage or backend
  }

  return (
    <ProfileView
      initials="У"
      name="АБД"
      email="user@example.com"
      version="0.1.0"
      theme={theme}
      onThemeChange={handleThemeChange}
      onLogout={handleLogout}
      onChangePassword={handleChangePassword}
      onEditUsername={handleEditUsername}
    />
  )
}
