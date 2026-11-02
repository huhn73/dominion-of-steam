import { useEffect } from 'react'
import { useSettings } from '../data/profile'
import { useTheme } from '../theme/ThemeProvider'
import { applyReduceMotion } from './motion'

/**
 * Applies the saved settings of the logged-in player app-wide: color scheme (the server value
 * wins after login; the ThemeProvider keeps localStorage in sync for the pre-paint script) and
 * „Animationen reduzieren“. Board settings are applied in the match (`BoardSettingsLayer`).
 */
export function ApplyPlayerSettings() {
  const { data } = useSettings()
  const { theme, setTheme } = useTheme()
  const display = data?.settings.display

  useEffect(() => {
    if (display && display.theme !== theme) setTheme(display.theme)
  }, [display, theme, setTheme])

  const reduceMotion = display?.reduceMotion
  useEffect(() => {
    if (reduceMotion !== undefined) applyReduceMotion(reduceMotion)
  }, [reduceMotion])

  return null
}
