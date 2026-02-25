import type { ThemeName } from '@/shared/theme'

export type Theme = ThemeName

export type ProfileViewProps = {
  initials: string
  name: string
  email: string
  version: string
  theme: Theme
  onThemeChange: (theme: Theme) => void
  onLogout: () => void
  onChangePassword: () => void
  onUpdateUsername: (username: string) => Promise<void>
}
