import React from 'react';

import type { ThemeName, ThemeState, ThemeTokens } from './model/types';
import { applyTheme } from './lib/applyTheme';
import { loadThemeState, saveThemeState } from './lib/storage';

type ThemeApi = {
  theme: ThemeName;
  setTheme: (name: ThemeName) => void;
  tokens: ThemeTokens | undefined;
  setCustomTokens: (tokens: ThemeTokens) => void;
};

const ThemeContext = React.createContext<ThemeApi | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ThemeState>(() => {
    try {
      return loadThemeState();
    } catch {
      return { name: 'dark' };
    }
  });

  React.useEffect(() => {
    applyTheme(state.name, state.tokens);
    try {
      saveThemeState(state);
    } catch {
      // ignore
    }
  }, [state]);

  const api = React.useMemo<ThemeApi>(
    () => ({
      theme: state.name,
      tokens: state.tokens,
      setTheme: (name) => setState((prev) => (name === 'custom' ? { name: 'custom', tokens: prev.tokens } : { name })),
      setCustomTokens: (tokens) => setState({ name: 'custom', tokens }),
    }),
    [state],
  );

  return <ThemeContext.Provider value={api}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeApi {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
