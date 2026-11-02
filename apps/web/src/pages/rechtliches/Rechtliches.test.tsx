import { readFileSync } from 'node:fs'
import path from 'node:path'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../../test/renderApp'
import { mockApi } from '../../test/mockApi'
import { ANBIETER } from './anbieter'
import { SFX_RECORDINGS } from './LizenzenPage'

afterEach(() => vi.unstubAllGlobals())

// vitest runs in apps/web
const root = path.resolve(process.cwd(), '../..')
const read = (p: string) => readFileSync(path.join(root, p), 'utf8')

describe('Rechtliche Seiten', () => {
  it('zeigt das Impressum ohne Anmeldung und verlinkt die anderen Seiten', async () => {
    mockApi({})
    const { router } = renderApp('/impressum', { user: null })
    expect(await screen.findByRole('heading', { name: 'Impressum' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: ANBIETER.email })).toHaveAttribute(
      'href',
      `mailto:${ANBIETER.email}`,
    )
    const nav = screen.getByRole('navigation', { name: 'Rechtliches' })
    // The current page is plain text, the others are links
    expect(within(nav).queryByRole('link', { name: 'Impressum' })).toBeNull()
    await userEvent.click(within(nav).getByRole('link', { name: 'Datenschutz' }))
    expect(await screen.findByRole('heading', { name: 'Datenschutz' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/datenschutz')
    expect(screen.getByText('dos_session')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Lizenzen' }))
    expect(await screen.findByRole('heading', { name: 'Lizenzen' })).toBeInTheDocument()
  })

  it('führt „Zurück“ ohne Verlauf zur Startseite und damit zur Anmeldung', async () => {
    mockApi({})
    const { router } = renderApp('/datenschutz', { user: null })
    await screen.findByRole('heading', { name: 'Datenschutz' })
    await userEvent.click(screen.getByRole('button', { name: 'Zurück' }))
    expect(await screen.findByRole('heading', { name: 'Anmelden' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/anmelden')
  })

  it('listet Lizenz, Soundquellen und Schriften', async () => {
    mockApi({})
    renderApp('/lizenzen', { user: null })
    await screen.findByRole('heading', { name: 'Lizenzen' })
    expect(screen.getByText(/steht unter der MIT-Lizenz/)).toBeInTheDocument()
    expect(screen.getByText(/Permission is hereby granted/)).toBeInTheDocument()
    const first = SFX_RECORDINGS[0]!
    expect(screen.getByRole('link', { name: first.title })).toHaveAttribute('href', first.source)
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(SFX_RECORDINGS.length)
    expect(screen.getByRole('link', { name: 'Lizenztext' })).toHaveAttribute(
      'href',
      '/audio/CC0-1.0.txt',
    )
    expect(screen.getByText(/Big Shoulders Display/)).toBeInTheDocument()
  })

  it('zeigt die Links unter der Anmeldekarte', async () => {
    mockApi({})
    renderApp('/anmelden', { user: null })
    await screen.findByRole('heading', { name: 'Anmelden' })
    const nav = screen.getByRole('navigation', { name: 'Rechtliches' })
    expect(
      within(nav)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(['Impressum', 'Datenschutz', 'Lizenzen'])
  })

  it('hat eine Fußzeile unter den Menüseiten und einen Eintrag im Benutzermenü', async () => {
    mockApi({})
    const { router } = renderApp('/')
    await screen.findByText('Björn, an allen Fronten ist es ruhig.')
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByRole('navigation', { name: 'Rechtliches' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Benutzermenü für Björn' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Rechtliches' }))
    expect(await screen.findByRole('heading', { name: 'Impressum' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/impressum')
    // Opened from the menu, "Zurück" goes back to the lobby
    await userEvent.click(screen.getByRole('button', { name: 'Zurück' }))
    expect(await screen.findByText('Björn, an allen Fronten ist es ruhig.')).toBeInTheDocument()
  })

  it('zeigt im Spielfeld keine Fußzeile', async () => {
    mockApi({})
    renderApp('/partie/demo')
    await screen.findByRole('button', { name: 'Zurück zur Lobby' })
    expect(screen.queryByRole('contentinfo')).toBeNull()
  })
})

describe('Icons und Manifest', () => {
  const manifest = JSON.parse(read('public/manifest.webmanifest')) as {
    name: string
    theme_color: string
    icons: { src: string; sizes: string; type: string }[]
  }

  it('verweist nur auf vorhandene Dateien', () => {
    expect(manifest.name).toBe('Dominion of Steam')
    for (const icon of manifest.icons) {
      expect(() => readFileSync(path.join(root, 'public', icon.src)), icon.src).not.toThrow()
    }
    for (const file of ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'])
      expect(() => readFileSync(path.join(root, 'public', file)), file).not.toThrow()
  })

  it('ist in index.html eingebunden, ohne externe Schriften', () => {
    const html = read('apps/web/index.html')
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />')
    expect(html).toContain('<link rel="icon" href="/favicon.ico" sizes="32x32" />')
    expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png" />')
    expect(html).toContain(`<meta name="theme-color" content="${manifest.theme_color}" />`)
    expect(html).not.toMatch(/googleapis|gstatic/)
    expect(read('public/sw.js')).toContain("icon: '/icon-192.png'")
  })
})
