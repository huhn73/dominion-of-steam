import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../test/renderApp'
import { demoView, mockApi, testSettings } from '../test/mockApi'
import { hexToPixel } from '../sections/spielfeld/components/hex'

afterEach(() => vi.unstubAllGlobals())

describe('Partie-Seite', () => {
  it('zeigt einen Ladezustand und danach das Spielfeld', async () => {
    mockApi({ 'GET /matches/demo/view': () => ({ json: demoView() }) })
    renderApp('/partie/demo')
    expect(screen.getByRole('heading', { name: 'Lade Partie …' })).toBeInTheDocument()
    expect(await screen.findByRole('application', { name: 'Spielkarte' })).toBeInTheDocument()
  })

  it('meldet unbekannte Partien', async () => {
    mockApi({})
    renderApp('/partie/gibt-es-nicht')
    expect(
      await screen.findByRole('heading', { name: 'Partie nicht gefunden' }),
    ).toBeInTheDocument()
  })

  it('bietet bei Serverfehlern einen erneuten Versuch an', { timeout: 10_000 }, async () => {
    let fail = true
    mockApi({
      'GET /matches/demo/view': () =>
        fail
          ? { status: 500, json: { error: { code: 'X', message: 'Kaputt' } } }
          : { json: demoView() },
    })
    renderApp('/partie/demo')
    // der Hook versucht es selbst zweimal, bevor er den Fehler zeigt
    const retry = await screen.findByRole('button', { name: /Erneut versuchen/ }, { timeout: 5000 })
    fail = false
    await userEvent.click(retry)
    expect(await screen.findByRole('application', { name: 'Spielkarte' })).toBeInTheDocument()
  })

  it('schickt Befehle an den Server und übernimmt die neue Sicht', async () => {
    const after = demoView()
    after.units = after.units.map((u) =>
      u.id === 'u1' ? { ...u, order: { type: 'sentry' }, needsOrders: false } : u,
    )
    const { calls } = mockApi({
      'GET /matches/demo/view': () => ({ json: demoView() }),
      'POST /matches/demo/commands': () => ({ json: { view: after } }),
    })
    renderApp('/partie/demo')
    const next = await screen.findByRole('button', { name: /Nächste/ })
    expect(next).toHaveTextContent('5')
    await userEvent.click(next)
    const panel = screen.getByRole('region', { name: /^Einheit / })
    await userEvent.click(within(panel).getByRole('button', { name: /Wache/ }))
    expect(calls.at(-1)).toMatchObject({ method: 'POST', body: { type: 'sentry', unitId: 'u1' } })
    expect(await screen.findByRole('button', { name: /Nächste/ })).toHaveTextContent('4')
  })

  it('zeigt abgelehnte Aktionen als Hinweis', async () => {
    mockApi({
      'GET /matches/demo/view': () => ({ json: demoView() }),
      'POST /matches/demo/commands': () => ({
        status: 409,
        json: { error: { code: 'NOT_YOUR_TURN', message: 'Du bist nicht am Zug.' } },
      }),
    })
    renderApp('/partie/demo')
    await userEvent.click(await screen.findByRole('button', { name: /Nächste/ }))
    await userEvent.click(
      within(screen.getByRole('region', { name: /^Einheit / })).getByRole('button', {
        name: /Wache/,
      }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Aktion abgelehnt: Du bist nicht am Zug.',
    )
  })
})

describe('Lobby (Dev)', () => {
  it('legt eine Solo-Partie an und öffnet sie', async () => {
    const { calls } = mockApi({
      'POST /dev/matches/solo': () => ({ json: { matchId: 'solo-1', seed: 'KOHLE-1' } }),
      'GET /matches/solo-1/view': () => ({ json: demoView() }),
    })
    const { router } = renderApp('/')
    const sizeSelect = screen.getByRole('combobox', { name: 'Kartengröße' })
    expect(
      within(sizeSelect)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Klein', 'Mittel', 'Groß', 'Riesig', 'Imperium'])
    await userEvent.selectOptions(sizeSelect, 'small')
    await userEvent.click(screen.getByRole('button', { name: 'Neue Solo-Partie' }))
    expect(calls.find((c) => c.path === '/dev/matches/solo')).toMatchObject({
      body: { size: 'small', opponents: 2, difficulty: 'normal' },
    })
    await screen.findByRole('application', { name: 'Spielkarte' })
    expect(router.state.location.pathname).toBe('/partie/solo-1')
  })
})

describe('Partie ohne Teilnahme', () => {
  it('zeigt den Hinweis ohne erneuten Versuch', async () => {
    mockApi({
      'GET /matches/demo/view': () => ({
        status: 403,
        json: {
          error: { code: 'NOT_PARTICIPANT', message: 'Du nimmst an dieser Partie nicht teil.' },
        },
      }),
    })
    renderApp('/partie/demo')
    expect(await screen.findByText('Du nimmst an dieser Partie nicht teil.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Erneut versuchen/ })).not.toBeInTheDocument()
  })
})

describe('Rundenbericht in der Partie', () => {
  it('zeigt den Bericht vor der Wiedergabe, mit dem entdeckten Stadtwechsel der Demo', async () => {
    const { calls } = mockApi({ 'GET /matches/demo/view': () => ({ json: demoView('replay') }) })
    renderApp('/partie/demo')
    const dialog = await screen.findByRole('dialog', { name: /Rundenbericht/ })
    expect(dialog).toHaveTextContent('Port Aurel ist jetzt in der Hand von Admiral Kessler.')
    expect(screen.queryByText(/Gegnerzug ·/)).not.toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: /Gegnerzüge ansehen/ }))
    expect(screen.getByText(/Gegnerzug ·/)).toBeInTheDocument()
    expect(calls.some((c) => c.path === '/matches/demo/commands')).toBe(false)
  })

  it('lässt sich über die Einstellung abschalten', async () => {
    mockApi({
      'GET /settings': () => ({ json: testSettings((s) => (s.display.turnReport = false)) }),
      'GET /matches/demo/view': () => ({ json: demoView('replay') }),
    })
    renderApp('/partie/demo')
    expect(await screen.findByText(/Gegnerzug ·/)).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /Rundenbericht/ })).not.toBeInTheDocument()
  })
})

describe('Erkunden in der Partie', () => {
  it('schickt den Erkundungsbefehl für den angetippten Doppeldecker', async () => {
    const { calls } = mockApi({
      'GET /matches/demo/view': () => ({ json: demoView() }),
      'POST /matches/demo/commands': () => ({ json: { view: demoView() } }),
    })
    renderApp('/partie/demo')
    const map = await screen.findByRole('application', { name: 'Spielkarte' })
    const { x, y } = hexToPixel({ col: 8, row: 3 })
    fireEvent.pointerDown(map, { clientX: x, clientY: y, pointerId: 1, button: 0 })
    fireEvent.pointerUp(map, { clientX: x, clientY: y, pointerId: 1, button: 0 })
    const panel = await screen.findByRole('region', { name: 'Einheit Doppeldecker' })
    await userEvent.click(within(panel).getByRole('button', { name: /Erkunden/ }))
    expect(calls.at(-1)).toMatchObject({ method: 'POST', body: { type: 'explore', unitId: 'u8' } })
  })
})

describe('Ton in der Partie', () => {
  it('startet die Schichten, folgt der Lage und spielt die Auswahl', async () => {
    sessionStorage.clear() // the theme plays once per match and browser tab
    const view = demoView()
    mockApi({ 'GET /matches/demo/view': () => ({ json: view }) })
    const { audio } = renderApp('/partie/demo')
    await screen.findByRole('application', { name: 'Spielkarte' })
    expect(audio.layers[0]).toBe('field-explore')
    expect(audio.music).toEqual([]) // no menu music in the match
    // Board effects are loaded up front, the faction theme greets once
    const preloaded = audio.calls
      .filter((c) => c.method === 'preload')
      .flatMap((c) => c.args[0] as string[])
    expect(preloaded).toContain('grenadiere-move')
    expect(preloaded).toContain('city-captured')
    expect(audio.stingers).toContain(`${view.participants.find((p) => p.isYou)!.factionId}-theme`)
    const enemyInSight = view.units.some((u) => u.ownerId !== view.match.youId)
    if (enemyInSight) await waitFor(() => expect(audio.layers).toContain('field-tension'))
    await userEvent.click(await screen.findByRole('button', { name: /Nächste/ }))
    expect(audio.sfx.some((id) => id.endsWith('-select'))).toBe(true)
  })

  it('spielt bei abgelehnten Befehlen einen Fehlerton', async () => {
    mockApi({
      'GET /matches/demo/view': () => ({ json: demoView() }),
      'POST /matches/demo/commands': () => ({
        status: 409,
        json: { error: { code: 'NOT_YOUR_TURN', message: 'Du bist nicht am Zug.' } },
      }),
    })
    const { audio } = renderApp('/partie/demo')
    await userEvent.click(await screen.findByRole('button', { name: /Nächste/ }))
    const panel = screen.getByRole('region', { name: /^Einheit / })
    await userEvent.click(within(panel).getByRole('button', { name: /Wache/ }))
    await screen.findByText(/Du bist nicht am Zug/)
    expect(audio.sfx).toContain('ui-error')
  })

  it('spielt das Fraktionsstück bei Sieg und beendet die Schichten', async () => {
    const view = demoView()
    const me = view.participants.find((p) => p.isYou)!
    view.result = {
      winnerId: me.id,
      endedAt: '2026-10-31T12:00:00Z',
      placements: { [me.id]: 1 },
      reason: 'elimination',
    }
    mockApi({ 'GET /matches/demo/view': () => ({ json: view }) })
    const { audio } = renderApp('/partie/demo')
    await screen.findByRole('application', { name: 'Spielkarte' })
    await waitFor(() => expect(audio.stingers).toContain(`${me.factionId}-victory`))
  })

  it('zeigt am Ende die Ergebniskarte, die Kopfzeile „Beendet“ und führt zur Lobby', async () => {
    const view = demoView()
    view.match.phase = 'waiting'
    const me = view.participants.find((p) => p.isYou)!
    const others = view.participants.filter((p) => !p.isYou)
    view.result = {
      winnerId: me.id,
      endedAt: '2026-10-31T12:00:00Z',
      placements: Object.fromEntries([me, ...others].map((p, i) => [p.id, i + 1])),
      reason: 'elimination',
    }
    mockApi({ 'GET /matches/demo/view': () => ({ json: view }) })
    sessionStorage.clear() // the result piece plays once per match and browser tab
    const { router, audio } = renderApp('/partie/demo')
    const dialog = await screen.findByRole('dialog', { name: 'Sieg' })
    expect(within(dialog).getAllByRole('row')).toHaveLength(view.participants.length + 1)
    expect(screen.getByText('Beendet · Sieg')).toBeInTheDocument()
    expect(screen.queryByText(/Warte auf/)).toBeNull()
    await waitFor(() => expect(audio.stingers).toContain(`${me.factionId}-victory`))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Zur Lobby' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    // The result piece gives way to the lobby music instead of playing over it
    const methods = audio.calls.map((c) => c.method)
    expect(methods.indexOf('stopStinger')).toBeGreaterThan(methods.indexOf('playStinger'))
    expect(audio.music).toEqual(['menu-lobby'])
  })
})
