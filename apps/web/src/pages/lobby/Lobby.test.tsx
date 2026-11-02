import { act, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../../test/renderApp'
import { mockApi, testUser } from '../../test/mockApi'
import { emptyLobby, lobbyData, NOW, roomData } from '../../test/lobbyData'
import { useTickingNow } from '../../data/lobby'

afterEach(() => vi.unstubAllGlobals())

const error = (status: number, code: string, message: string) => ({
  status,
  json: { error: { code, message } },
})

describe('Lobby', () => {
  it('zeigt Ladezustand, dann den Lagebericht und spielt weiter', async () => {
    mockApi({ 'GET /lobby': () => ({ json: lobbyData() }) })
    const { router } = renderApp('/')
    expect(screen.getByText('Lade Lagebericht …')).toBeInTheDocument()
    expect(await screen.findByText('Björn, 1 Front wartet auf deinen Befehl.')).toBeInTheDocument()
    const yourTurn = screen.getByRole('region', { name: 'Du bist am Zug' })
    expect(within(yourTurn).getByText('noch 1 Std. 40 Min.')).toBeInTheDocument()
    const others = screen.getByRole('region', { name: 'Weitere Partien' })
    expect(within(others).getByText('Lena Hartmann ist am Zug')).toBeInTheDocument()
    expect(within(others).getByText('Wartet auf 2 Spieler')).toBeInTheDocument()

    await userEvent.click(within(yourTurn).getByRole('button', { name: /Weiterspielen/ }))
    expect(router.state.location.pathname).toBe('/partie/m-salz')
  })

  it('zeigt einem neuen Spieler alle Leerzustände und führt zur neuen Partie', async () => {
    mockApi({ 'GET /lobby': () => ({ json: emptyLobby() }) })
    const { router } = renderApp('/')
    expect(await screen.findByText('Björn, an allen Fronten ist es ruhig.')).toBeInTheDocument()
    expect(screen.getByText('Du bist nirgends am Zug')).toBeInTheDocument()
    expect(screen.getByText('Keine weiteren laufenden Partien.')).toBeInTheDocument()
    expect(screen.getByText('Keine offenen Einladungen.')).toBeInTheDocument()
    expect(
      screen.getByText('Gerade sucht niemand Mitspieler. Erstelle selbst eine offene Partie.'),
    ).toBeInTheDocument()
    const region = screen.getByRole('region', { name: 'Du bist am Zug' })
    await userEvent.click(within(region).getByRole('button', { name: /Neue Partie/ }))
    expect(router.state.location.pathname).toBe('/neue-partie')
  })

  it('erinnert an die unbestätigte E-Mail-Adresse und schickt den Link erneut', async () => {
    const { calls } = mockApi({
      'POST /account/verify/resend': () =>
        error(429, 'RESEND_COOLDOWN', 'Wir haben dir gerade erst eine E-Mail geschickt.'),
    })
    renderApp('/', { user: { ...testUser, emailVerified: false } })
    const notice = await screen.findByRole('region', { name: 'E-Mail-Adresse bestätigen' })
    expect(notice).toHaveTextContent('Bitte bestätige deine E-Mail-Adresse bjoern@dominion.test')
    expect(within(notice).getByRole('link', { name: 'Adresse ändern' })).toHaveAttribute(
      'href',
      '/einstellungen',
    )
    await userEvent.click(within(notice).getByRole('button', { name: 'Erneut senden' }))
    expect(calls.some((c) => c.method === 'POST' && c.path === '/account/verify/resend')).toBe(true)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Wir haben dir gerade erst eine E-Mail geschickt.',
    )
  })

  it('zeigt bestätigten Spielern keinen Hinweis', async () => {
    mockApi({})
    renderApp('/')
    await screen.findByText('Björn, an allen Fronten ist es ruhig.')
    expect(
      screen.queryByRole('region', { name: 'E-Mail-Adresse bestätigen' }),
    ).not.toBeInTheDocument()
  })

  it('meldet Ladefehler mit erneutem Versuch', async () => {
    let fail = true
    mockApi({
      'GET /lobby': () =>
        fail ? error(500, 'UNKNOWN', 'Der Server hat ein Problem.') : { json: emptyLobby() },
    })
    renderApp('/')
    expect(await screen.findByRole('alert')).toHaveTextContent('Der Server hat ein Problem.')
    fail = false
    await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))
    expect(await screen.findByText('Du bist nirgends am Zug')).toBeInTheDocument()
  })

  it('erinnert den Mitspieler und lädt danach neu; die Sperre kommt vom Server', async () => {
    let reminded: string | null = null
    const { calls } = mockApi({
      'GET /lobby': () => ({
        json: lobbyData({
          matches: [
            {
              ...lobbyData().matches[0]!,
              remindedAt: reminded,
            },
          ],
        }),
      }),
      'POST /matches/m-nordwind/remind': () => {
        reminded = NOW
        return { json: { remindedAt: NOW } }
      },
    })
    renderApp('/')
    await userEvent.click(await screen.findByRole('button', { name: /Erinnern/ }))
    expect(calls.find((c) => c.path === '/matches/m-nordwind/remind')?.body).toEqual({
      participantId: 'lena',
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Erinnerung verschickt')
    expect(await screen.findByRole('button', { name: /Erinnert/ })).toBeDisabled()
  })

  it('zeigt Fehler des Servers, z. B. die Erinnerungs-Sperre', async () => {
    mockApi({
      'GET /lobby': () => ({ json: lobbyData() }),
      'POST /matches/m-nordwind/remind': () =>
        error(
          429,
          'REMIND_COOLDOWN',
          'Du hast in dieser Partie schon erinnert. Erneut erinnern kannst du in 9 Std.',
        ),
    })
    renderApp('/')
    await userEvent.click(await screen.findByRole('button', { name: /Erinnern/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Erneut erinnern kannst du in 9 Std.',
    )
  })

  it('nimmt eine Einladung an und öffnet den Warteraum', async () => {
    mockApi({
      'GET /lobby': () => ({ json: lobbyData() }),
      'POST /invitations/inv-1/accept': () => ({ json: { matchId: 'm-insel' } }),
      'GET /matches/m-insel/room': () => ({ json: roomData({ matchId: 'm-insel' }) }),
    })
    const { router } = renderApp('/')
    await userEvent.click(await screen.findByRole('button', { name: /Annehmen/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/warteraum/m-insel'))
  })

  it('lehnt eine Einladung ab', async () => {
    const { calls } = mockApi({
      'GET /lobby': () => ({ json: lobbyData() }),
      'POST /invitations/inv-1/decline': () => ({ json: { ok: true } }),
    })
    renderApp('/')
    await userEvent.click(await screen.findByRole('button', { name: /Ablehnen/ }))
    expect(await screen.findByRole('status')).toHaveTextContent('Einladung abgelehnt')
    expect(calls.some((c) => c.path === '/invitations/inv-1/decline')).toBe(true)
  })

  it('meldet „Partie voll“ beim Beitreten', async () => {
    mockApi({
      'GET /lobby': () => ({ json: lobbyData() }),
      'POST /matches/open-1/join': () =>
        error(409, 'MATCH_FULL', 'Partie voll: Alle freien Plätze sind schon besetzt.'),
    })
    const { router } = renderApp('/')
    await userEvent.click(await screen.findByRole('button', { name: /Beitreten/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Partie voll')
    expect(router.state.location.pathname).toBe('/')
  })

  it('gibt eine Partie nach Bestätigung auf', async () => {
    const { calls } = mockApi({
      'GET /lobby': () => ({ json: lobbyData() }),
      'POST /matches/m-salz/surrender': () => ({ json: { ok: true } }),
    })
    renderApp('/')
    const region = await screen.findByRole('region', { name: 'Du bist am Zug' })
    const trigger = within(region).getByRole('button', { name: 'Weitere Aktionen' })
    // the menu hangs below the card, so the card must not clip it
    expect(trigger.closest('article')).not.toHaveClass('overflow-hidden')
    await userEvent.click(trigger)
    await userEvent.click(screen.getByRole('menuitem', { name: /Aufgeben/ }))
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Partie aufgeben?' })).getByRole('button', {
        name: /^Aufgeben$/,
      }),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Eine KI führt deine Fraktion weiter',
    )
    expect(calls.filter((c) => c.path === '/matches/m-salz/surrender')).toHaveLength(1)
  })
})

describe('Push-Banner', () => {
  function stubPush(
    permission: NotificationPermission,
    result: NotificationPermission = 'granted',
  ) {
    const subscription = {
      endpoint: 'https://push.example/abc',
      toJSON: () => ({ endpoint: 'https://push.example/abc', keys: { p256dh: 'p', auth: 'a' } }),
    }
    const registration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockResolvedValue(subscription),
      },
    }
    const requestPermission = vi.fn(async () => {
      Notification.permission = result
      return result
    })
    const Notification = { permission, requestPermission }
    vi.stubGlobal('Notification', Notification)
    vi.stubGlobal('PushManager', class {})
    vi.stubGlobal('navigator', {
      ...navigator,
      serviceWorker: {
        register: vi.fn().mockResolvedValue(registration),
        ready: Promise.resolve(registration),
        getRegistration: vi.fn().mockResolvedValue(registration),
      },
    })
    return { requestPermission, registration }
  }

  it('aktiviert Push: Berechtigung, Abo beim Server, danach kein Banner', async () => {
    const { requestPermission, registration } = stubPush('default')
    const { calls } = mockApi({
      'GET /push/key': () => ({ json: { publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa' } }),
      'POST /push/subscribe': () => ({ status: 201, json: { ok: true } }),
    })
    renderApp('/')
    expect(await screen.findByText('Benachrichtige mich, wenn ich am Zug bin')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Aktivieren' }))
    expect(requestPermission).toHaveBeenCalled()
    await waitFor(() =>
      expect(calls.find((c) => c.path === '/push/subscribe')?.body).toEqual({
        endpoint: 'https://push.example/abc',
        keys: { p256dh: 'p', auth: 'a' },
      }),
    )
    expect(registration.pushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true }),
    )
    expect(screen.queryByText('Benachrichtige mich, wenn ich am Zug bin')).not.toBeInTheDocument()
  })

  it('zeigt bei blockierter Berechtigung den Hilfetext', async () => {
    stubPush('denied')
    mockApi({})
    renderApp('/')
    expect(
      await screen.findByText('Benachrichtigungen sind im Browser blockiert'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aktivieren' })).not.toBeInTheDocument()
  })

  it('merkt sich „Später“ für diesen Spieler', async () => {
    stubPush('default')
    mockApi({})
    const first = renderApp('/')
    await userEvent.click(await screen.findByRole('button', { name: 'Später' }))
    expect(screen.queryByText('Benachrichtige mich, wenn ich am Zug bin')).not.toBeInTheDocument()
    first.unmount()
    renderApp('/')
    await screen.findByText('Du bist nirgends am Zug')
    expect(screen.queryByText('Benachrichtige mich, wenn ich am Zug bin')).not.toBeInTheDocument()
  })

  it('zeigt ohne Push-Unterstützung im Browser kein Banner', async () => {
    mockApi({})
    renderApp('/')
    await screen.findByText('Du bist nirgends am Zug')
    expect(screen.queryByText(/Benachrichtig/)).not.toBeInTheDocument()
  })
})

describe('Zeitbezug', () => {
  it('lässt `now` jede Minute weiterlaufen (mit dem Versatz zur Serverzeit)', () => {
    vi.useFakeTimers({ now: new Date('2026-10-30T15:00:00Z') })
    try {
      const { result } = renderHook(() => useTickingNow(NOW))
      expect(result.current).toBe('2026-10-30T13:00:00.000Z')
      act(() => vi.advanceTimersByTime(60_000))
      expect(result.current).toBe('2026-10-30T13:01:00.000Z')
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('Warteraum', () => {
  it('zeigt die Plätze, meldet bereit und kopiert den Link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    const { calls } = mockApi({
      'GET /matches/m-kohle2/room': () => ({ json: roomData() }),
      'POST /matches/m-kohle2/ready': () => ({ json: { ok: true } }),
    })
    renderApp('/warteraum/m-kohle2')
    expect(await screen.findByRole('heading', { name: 'Die Kohleinseln II' })).toBeInTheDocument()
    expect(screen.getByText('2 von 3 Plätzen besetzt · 1 bereit')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Starten/ })).toBeDisabled()
    expect(screen.getAllByText('Warte auf Jonas Vogt').length).toBeGreaterThan(0)

    await userEvent.click(screen.getByRole('button', { name: 'Bereit' }))
    expect(calls.find((c) => c.path === '/matches/m-kohle2/ready')?.body).toEqual({ ready: false })

    await userEvent.click(screen.getByRole('button', { name: /Kopieren/ }))
    expect(writeText).toHaveBeenCalledWith('http://localhost/einladung/K7Q-2XM-H9P')
    expect(await screen.findByRole('status')).toHaveTextContent('Link kopiert')
  })

  it('startet als Ersteller mit KI-Auffüllen und öffnet das Spielfeld', async () => {
    const ready = roomData()
    ready.room.seats = ready.room.seats.map((s) =>
      s.kind === 'player' ? { ...s, status: 'ready' as const } : s,
    )
    const { calls } = mockApi({
      'GET /matches/m-kohle2/room': () => ({ json: ready }),
      'POST /matches/m-kohle2/start': () => ({ json: { matchId: 'm-kohle2' } }),
    })
    const { router } = renderApp('/warteraum/m-kohle2')
    expect(
      await screen.findByText('Alle sind bereit. Die Partie kann beginnen.'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Starten/ }))
    expect(calls.find((c) => c.path === '/matches/m-kohle2/start')?.body).toEqual({
      fillEmptyWithAI: true,
    })
    await waitFor(() => expect(router.state.location.pathname).toBe('/partie/m-kohle2'))
  })

  it('verlässt den Warteraum nach Bestätigung', async () => {
    mockApi({
      'GET /matches/m-kohle2/room': () => ({ json: roomData({ isHost: false }) }),
      'POST /matches/m-kohle2/leave': () => ({ json: { dissolved: false } }),
    })
    const { router } = renderApp('/warteraum/m-kohle2')
    await userEvent.click(await screen.findByRole('button', { name: 'Verlassen' }))
    const dialog = screen.getByRole('dialog', { name: 'Warteraum verlassen?' })
    await userEvent.click(within(dialog).getByRole('button', { name: /Verlassen/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(await screen.findByRole('status')).toHaveTextContent('Warteraum verlassen')
  })

  it('übernimmt einen vom Server geänderten eigenen Bereit-Status', async () => {
    let ready = true
    mockApi({
      'GET /matches/m-kohle2/room': () => {
        const data = roomData()
        data.room.seats[0] = { ...data.room.seats[0]!, status: ready ? 'ready' : 'joined' } as never
        return { json: data }
      },
    })
    const { queryClient } = renderApp('/warteraum/m-kohle2')
    expect(await screen.findByRole('button', { name: 'Bereit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    ready = false
    await act(() => queryClient.invalidateQueries({ queryKey: ['room', 'm-kohle2'] }))
    expect(await screen.findByRole('button', { name: 'Bereit melden' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('wechselt zum Spielfeld, sobald die Partie läuft', async () => {
    mockApi({
      'GET /matches/m-kohle2/room': () => ({ json: { ...roomData(), status: 'running' } }),
      'GET /matches/m-kohle2/view': () => error(500, 'X', 'egal'),
    })
    const { router } = renderApp('/warteraum/m-kohle2')
    await waitFor(() => expect(router.state.location.pathname).toBe('/partie/m-kohle2'))
  })

  it('meldet eine aufgelöste Partie', async () => {
    mockApi({
      'GET /matches/m-weg/room': () => error(404, 'MATCH_NOT_FOUND', 'Partie nicht gefunden.'),
    })
    renderApp('/warteraum/m-weg')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Diese Partie gibt es nicht mehr. Vielleicht hat der Ersteller sie aufgelöst.',
    )
    expect(screen.getByRole('link', { name: 'Zur Lobby' })).toBeInTheDocument()
  })
})

describe('Einladungslink', () => {
  it('besetzt einen Platz und öffnet den Warteraum', async () => {
    const { calls } = mockApi({
      'POST /invite/K7Q-2XM-H9P': () => ({ json: { matchId: 'm-kohle2' } }),
      'GET /matches/m-kohle2/room': () => ({ json: roomData() }),
    })
    const { router } = renderApp('/einladung/K7Q-2XM-H9P')
    await waitFor(() => expect(router.state.location.pathname).toBe('/warteraum/m-kohle2'))
    expect(calls.filter((c) => c.path === '/invite/K7Q-2XM-H9P')).toHaveLength(1)
  })

  it('zeigt „Partie voll“ und ungültige Links verständlich an', async () => {
    mockApi({
      'POST /invite/K7Q-2XM-H9P': () =>
        error(409, 'MATCH_FULL', 'Partie voll: Alle freien Plätze sind schon besetzt.'),
    })
    renderApp('/einladung/K7Q-2XM-H9P')
    expect(await screen.findByRole('heading', { name: 'Partie voll' })).toBeInTheDocument()
  })

  it('schickt Abgemeldete zur Anmeldung und danach zurück zum Link', async () => {
    mockApi({
      'GET /me': () => error(401, 'NOT_AUTHENTICATED', 'Bitte melde dich an.'),
    })
    const { router } = renderApp('/einladung/K7Q-2XM-H9P', { user: undefined })
    await waitFor(() => expect(router.state.location.pathname).toBe('/anmelden'))
    expect(router.state.location.search).toBe(
      `?weiter=${encodeURIComponent('/einladung/K7Q-2XM-H9P')}`,
    )
  })
})
