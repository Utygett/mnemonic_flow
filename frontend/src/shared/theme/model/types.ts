export const THEME_TOKEN_KEYS = [
  'bg',
  'surface',
  'surface-2',
  'text',
  'muted',
  'primary',
  'primary-contrast',
  'border',
  'shadow',
  'radius-sm',
  'radius-md',
] as const

export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number]

export type ThemeName = 'dark' | 'light' | 'custom'

export type ThemeTokens = Partial<Record<ThemeTokenKey, string>>

export type ThemeState = {
  name: ThemeName
  tokens?: ThemeTokens // only meaningful for 'custom'
}
