import type { ThemeState, ThemeTokens } from '../model/types'

const KEY_THEME = 'ui.theme'
const KEY_TOKENS = 'ui.theme.tokens'

export function loadThemeState(): ThemeState {
  const name = (localStorage.getItem(KEY_THEME) as any) || 'dark'

  if (name === 'custom') {
    let tokens: ThemeTokens | undefined
    try {
      const raw = localStorage.getItem(KEY_TOKENS)
      tokens = raw ? (JSON.parse(raw) as ThemeTokens) : undefined
    } catch {
      tokens = undefined
    }
    return { name: 'custom', tokens }
  }

  return { name: name === 'light' ? 'light' : 'dark' }
}

export function saveThemeState(state: ThemeState) {
  localStorage.setItem(KEY_THEME, state.name)

  if (state.name === 'custom') {
    try {
      localStorage.setItem(KEY_TOKENS, JSON.stringify(state.tokens ?? {}))
    } catch {
      // ignore
    }
  } else {
    localStorage.removeItem(KEY_TOKENS)
  }
}
