export type Theme = 'light' | 'blue' | 'dark'

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
