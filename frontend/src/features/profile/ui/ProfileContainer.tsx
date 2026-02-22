import { useEffect, useState } from 'react'

import { ProfileView } from './ProfileView'
import type { Theme } from '../model/types'
import { APP_VERSION } from '@/shared/lib/version'
import { getMe, updateUsername } from '@/shared/api'
import { useTheme } from '@/shared/theme'

type UserData = {
  id: string
  email: string
  username: string
}

export function ProfileContainer() {
  const { theme, setTheme } = useTheme()
  const [userData, setUserData] = useState<UserData | null>(null)

  useEffect(() => {
    // Загружаем данные пользователя при монтировании
    const token = localStorage.getItem('access_token')
    if (token) {
      getMe(token)
        .then(data => {
          setUserData(data)
        })
        .catch(err => {
          console.error('Failed to load user data:', err)
        })
    }
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.href = '/auth'
  }

  const handleChangePassword = () => {
    alert('Смена пароля (заглушка)')
  }

  const handleUpdateUsername = async (username: string) => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Not authenticated')
    }

    const updated = await updateUsername(username, token)
    setUserData(updated)
  }

  if (!userData) {
    return <div>Загрузка...</div>
  }

  return (
    <ProfileView
      initials={getInitials(userData.username)}
      name={userData.username}
      email={userData.email}
      version={APP_VERSION}
      theme={theme as Theme}
      onThemeChange={setTheme}
      onLogout={handleLogout}
      onChangePassword={handleChangePassword}
      onUpdateUsername={handleUpdateUsername}
    />
  )
}
