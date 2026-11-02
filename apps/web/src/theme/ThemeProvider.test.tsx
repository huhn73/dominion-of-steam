import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ThemeProvider, useTheme } from './ThemeProvider'
import { THEME_STORAGE_KEY } from './theme'

const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>

function mockSystemDark(matches: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  )
}

afterEach(() => vi.restoreAllMocks())

describe('Farbschema', () => {
  it('folgt standardmäßig dem System', () => {
    mockSystemDark(true)
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('system')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('speichert die Auswahl und setzt die Klasse .dark', () => {
    mockSystemDark(false)
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(document.documentElement).not.toHaveClass('dark')

    act(() => result.current.setTheme('dark'))
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')

    act(() => result.current.setTheme('light'))
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('liest eine gespeicherte Auswahl', () => {
    mockSystemDark(false)
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')
  })
})
