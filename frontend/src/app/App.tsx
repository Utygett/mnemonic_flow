import React from 'react'

import { AuthProvider } from './providers/auth/AuthContext'
import { AuthGate } from './providers/auth/AuthGate'

import { AppRouter } from './AppRouter'
import { MainShellContainer } from '../widgets/main-shell'
import { ThemeProvider } from '@/shared/theme'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter
          renderMain={() => (
            <AuthGate>
              <MainShellContainer />
            </AuthGate>
          )}
        />
      </AuthProvider>
    </ThemeProvider>
  )
}
