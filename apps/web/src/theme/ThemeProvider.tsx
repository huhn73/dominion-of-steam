import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  applyTheme,
  readThemePreference,
  watchSystemTheme,
  writeThemePreference,
  type ThemePreference,
} from './theme'

interface ThemeContextValue {
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(readThemePreference)

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    return watchSystemTheme(() => applyTheme('system'))
  }, [theme])

  const setTheme = useCallback((next: ThemePreference) => {
    writeThemePreference(next)
    setThemeState(next)
  }, [])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme muss innerhalb von ThemeProvider verwendet werden')
  return ctx
}
