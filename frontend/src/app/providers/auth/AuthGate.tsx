import React from 'react'
import { useAuth } from './AuthContext'
import { Login, Register } from '../../../pages/auth'
import { FirstUsernameSetup } from '@/features/onboarding'
import { updateUsername } from '@/shared/api'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { token, currentUser, refreshCurrentUser } = useAuth()
  const [mode, setMode] = React.useState<'login' | 'register'>('login')

  // Если пользователь не авторизован - показываем форму входа/регистрации
  if (!token || !currentUser) {
    return mode === 'login' ? (
      <Login onSwitch={() => setMode('register')} />
    ) : (
      <Register onSwitch={() => setMode('login')} />
    )
  }

  // Если имя пользователя пустое - показываем онбординг
  if (!currentUser.username || currentUser.username.trim() === '') {
    const handleComplete = async (username: string) => {
      if (!token) throw new Error('Not authenticated')
      await updateUsername(username, token)
      // Обновляем данные пользователя после сохранения
      await refreshCurrentUser()
    }

    return <FirstUsernameSetup initialUsername="" onComplete={handleComplete} />
  }

  return <>{children}</>
}
