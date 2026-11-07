import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../test/renderApp'
import { mockApi } from '../test/mockApi'
import { lobbyData, urgentMatch } from '../test/lobbyData'
import { MainNav } from '../shell'

beforeEach(() => {
  mockApi({
    'GET /lobby': () => ({
      json: lobbyData({ matches: [urgentMatch, { ...urgentMatch, id: 'm-zwei' }] }),
    }),
  })
})
afterEach(() => vi.unstubAllGlobals())

function desktopNav() {
  // Die Shell rendert die Navigation zweimal (Top-Navigation und mobile Tab-Leiste)
  return screen.getAllByRole('navigation', { name: 'Hauptnavigation' })[0]!
}

describe('Menü-Modus', () => {
  it('zeigt die vier Navigationspunkte, Lobby ist Startseite und aktiv', async () => {
    renderApp('/')
    expect(await screen.findByText('Lagezentrum')).toBeInTheDocument()
    const nav = within(desktopNav())
    // Badge: Partien, in denen der Spieler am Zug ist
    expect(nav.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Lobby2',
      'Neue Partie',
      'Fraktionen',
      'Freunde',
    ])
    expect(nav.getByRole('button', { name: /Lobby/ })).toHaveAttribute('aria-current', 'page')
  })

  it('wechselt per Navigation die Route und den aktiven Punkt', async () => {
    const { router } = renderApp('/')
    await userEvent.click(within(desktopNav()).getByRole('button', { name: 'Fraktionen' }))
    expect(router.state.location.pathname).toBe('/fraktionen')
    expect(within(desktopNav()).getByRole('button', { name: 'Fraktionen' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(desktopNav()).getByRole('button', { name: /Lobby/ })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('zeigt die Tab-Leiste für Smartphones', () => {
    renderApp('/')
    expect(screen.getAllByRole('navigation', { name: 'Hauptnavigation' })).toHaveLength(2)
  })

  it('kürzt das Badge ab 10 auf 9+', () => {
    render(<MainNav items={[{ label: 'Lobby', href: '/', badge: 12 }]} />)
    expect(screen.getByText('9+')).toBeInTheDocument()
  })

  it('zeigt bei unbekannter Route eine Fehlerseite', () => {
    renderApp('/gibt-es-nicht')
    expect(screen.getByRole('heading', { name: 'Nicht gefunden' })).toBeInTheDocument()
  })
})

describe('Benutzermenü', () => {
  it('zeigt Initialen und führt zu Profil und Einstellungen', async () => {
    const { router } = renderApp('/')
    const trigger = screen.getByRole('button', { name: 'Benutzermenü für Björn' })
    expect(trigger).toHaveTextContent('B')

    await userEvent.click(trigger)
    await userEvent.click(screen.getByRole('menuitem', { name: 'Profil' }))
    expect(router.state.location.pathname).toBe('/profil')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await userEvent.click(trigger)
    await userEvent.click(screen.getByRole('menuitem', { name: 'Einstellungen' }))
    expect(router.state.location.pathname).toBe('/einstellungen')
  })

  it('schließt mit Escape und bei Klick außerhalb', async () => {
    renderApp('/')
    const trigger = screen.getByRole('button', { name: 'Benutzermenü für Björn' })

    await userEvent.click(trigger)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await userEvent.click(trigger)
    await userEvent.click(await screen.findByRole('heading', { name: 'Lagebericht' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
