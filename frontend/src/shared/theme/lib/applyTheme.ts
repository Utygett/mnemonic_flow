import { THEME_TOKEN_KEYS } from '../model/types'
import type { ThemeName, ThemeTokens } from '../model/types'

export function applyTheme(name: ThemeName, tokens?: ThemeTokens) {
  const root = document.documentElement

  // preset selection
  root.dataset.theme = name === 'custom' ? 'dark' : name

  // clear previous runtime overrides
  for (const key of THEME_TOKEN_KEYS) {
    root.style.removeProperty(`--${key}`)
  }

  if (name === 'custom' && tokens) {
    for (const [k, v] of Object.entries(tokens)) {
      if (!v) continue
      root.style.setProperty(`--${k}`, String(v))
    }
  }
}
