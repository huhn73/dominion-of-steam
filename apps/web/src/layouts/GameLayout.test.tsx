import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../test/renderApp'
import { demoView, mockApi } from '../test/mockApi'
import { formatDeadline } from '../data/match'

afterEach(() => vi.unstubAllGlobals())

describe('Spiel-Modus', () => {
  it('zeigt die kompakte Kopfleiste mit Runde, Zugstatus und Frist statt der Navigation', async () => {
    mockApi({ 'GET /matches/demo/view': () => ({ json: demoView('yourTurn') }) })
    renderApp('/partie/demo')
    expect(await screen.findByText('Die Kohleinseln · Runde 14')).toBeInTheDocument()
    const status = screen.getByText(`Dein Zug · Frist ${formatDeadline('de', '2026-11-01T18:00:00Z')}`)
    expect(status.parentElement?.querySelector('.animate-pulse')).not.toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Hauptnavigation' })).not.toBeInTheDocument()
  })

  it('zeigt „Gegnerzüge“ während der Wiederholung', async () => {
    mockApi({ 'GET /matches/demo/view': () => ({ json: demoView('replay') }) })
    renderApp('/partie/demo')
    expect(await screen.findByText('Gegnerzüge')).toBeInTheDocument()
  })

  it('führt mit dem Zurück-Button zur Lobby', async () => {
    mockApi({ 'GET /matches/demo/view': () => ({ json: demoView() }) })
    const { router } = renderApp('/partie/demo')
    await userEvent.click(screen.getByRole('button', { name: 'Zurück zur Lobby' }))
    expect(router.state.location.pathname).toBe('/')
  })

  it('öffnet und schließt das Spielmenü', async () => {
    mockApi({ 'GET /matches/demo/view': () => ({ json: demoView() }) })
    const { router } = renderApp('/partie/demo')
    await userEvent.click(screen.getByRole('button', { name: 'Spielmenü' }))
    expect(screen.getByRole('menu', { name: 'Spielmenü' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Aufgeben/ })).toBeEnabled()

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu', { name: 'Spielmenü' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Spielmenü' }))
    await userEvent.click(screen.getByTestId('game-menu-backdrop'))
    expect(screen.queryByRole('menu', { name: 'Spielmenü' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Spielmenü' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Zurück zur Lobby' }))
    expect(router.state.location.pathname).toBe('/')
  })

  it('gibt nach Bestätigung auf und führt in die Lobby', async () => {
    const { calls } = mockApi({
      'GET /matches/demo/view': () => ({ json: demoView() }),
      'POST /matches/demo/surrender': () => ({ json: { ok: true } }),
    })
    const { router } = renderApp('/partie/demo')
    await screen.findByText('Die Kohleinseln · Runde 14')
    await userEvent.click(screen.getByRole('button', { name: 'Spielmenü' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /Aufgeben/ }))
    const dialog = screen.getByRole('dialog', { name: 'Partie aufgeben?' })
    expect(dialog).toHaveTextContent('Du verlässt Die Kohleinseln in Runde 14.')
    // Abbrechen schickt nichts
    await userEvent.click(screen.getByRole('button', { name: 'Weiterkämpfen' }))
    expect(calls.some((c) => c.path === '/matches/demo/surrender')).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: 'Spielmenü' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /Aufgeben/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Aufgeben' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(calls.filter((c) => c.path === '/matches/demo/surrender')).toHaveLength(1)
    expect(
      await screen.findByText('Du hast aufgegeben. Eine KI führt deine Fraktion weiter.'),
    ).toBeInTheDocument()
  })

  it('bietet kein Aufgeben an, wenn eine KI die eigene Fraktion führt', async () => {
    const view = demoView()
    view.participants = view.participants.map((p) => (p.isYou ? { ...p, isAI: true } : p))
    mockApi({ 'GET /matches/demo/view': () => ({ json: view }) })
    renderApp('/partie/demo')
    await screen.findByText('Die Kohleinseln · Runde 14')
    await userEvent.click(screen.getByRole('button', { name: 'Spielmenü' }))
    expect(screen.getByRole('menuitem', { name: /Aufgeben/ })).toBeDisabled()
  })
})
