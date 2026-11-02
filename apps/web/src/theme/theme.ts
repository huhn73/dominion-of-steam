export type ThemePreference = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'dos.theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    if (value === 'light' || value === 'dark' || value === 'system') return value
  } catch {
    // Speicher gesperrt (privates Fenster o. Ä.)
  }
  return 'system'
}

export function writeThemePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // ignorieren, Auswahl gilt dann nur für diese Sitzung
  }
}

export function systemPrefersDark() {
  return window.matchMedia(DARK_QUERY).matches
}

export function applyTheme(preference: ThemePreference) {
  const dark = preference === 'dark' || (preference === 'system' && systemPrefersDark())
  document.documentElement.classList.toggle('dark', dark)
}

export function watchSystemTheme(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
