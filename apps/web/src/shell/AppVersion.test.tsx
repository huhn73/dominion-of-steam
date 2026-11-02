import { render, screen } from '@testing-library/react'
import { appVersion } from '../version'
import { AppVersion } from './AppVersion'

const COMMIT = 'abc1234def5678901234567890abcdef12345678'

describe('Version', () => {
  it('zeigt lokal den Entwicklungsstand aus package.json, ohne Link', () => {
    const v = appVersion({})
    expect(v).toMatchObject({ commit: null, built: null, isRelease: false })
    expect(v.label).toMatch(/^\d+\.\d+\.\d+-dev$/)
    render(<AppVersion version={v} />)
    const el = screen.getByLabelText(`Version ${v.label}`)
    expect(el).toHaveTextContent(`v${v.label}`)
    expect(el.tagName).toBe('SPAN')
    expect(el).toHaveAttribute('title', 'Entwicklungsstand')
  })

  it('verlinkt ein Release und nennt Commit und Build-Datum', () => {
    const v = appVersion({
      VITE_APP_VERSION: '0.9.0',
      VITE_APP_COMMIT: COMMIT,
      VITE_APP_BUILT: '2026-11-02T18:30:00+01:00',
    })
    expect(v.isRelease).toBe(true)
    render(<AppVersion version={v} />)
    const link = screen.getByRole('link', { name: 'Version 0.9.0' })
    expect(link).toHaveTextContent('v0.9.0')
    expect(link.getAttribute('href')).toMatch(/\/releases\/tag\/v0\.9\.0$/)
    expect(link).toHaveAttribute('title', 'Commit abc1234 · gebaut am 2. November 2026')
  })

  it('verlinkt einen Stand zwischen zwei Releases auf seinen Commit', () => {
    const v = appVersion({ VITE_APP_VERSION: '0.9.0+abc1234', VITE_APP_COMMIT: COMMIT })
    expect(v.isRelease).toBe(false)
    render(<AppVersion version={v} />)
    const link = screen.getByRole('link', { name: 'Version 0.9.0+abc1234' })
    expect(link.getAttribute('href')).toMatch(new RegExp(`/commit/${COMMIT}$`))
  })
})
