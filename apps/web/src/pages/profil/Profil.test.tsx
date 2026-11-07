import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Me } from '@dos/shared/account'
import type { HistoryEntry, ProfileData } from '@dos/shared/profile'
import { renderApp } from '../../test/renderApp'
import { meKey } from '../../data/session'
import { demoView, mockApi, testSettings, testUser } from '../../test/mockApi'

afterEach(() => vi.unstubAllGlobals())

const error = (status: number, code: string, message: string) => ({
  status,
  json: { error: { code, message } },
})

const FACTIONS: ProfileData['factions'] = [
  {
    id: 'eisenbund',
    name: 'Eisenbund von Valdrin',
    shortName: 'Eisenbund',
    color: 'amber',
    emblemUrl: null,
  },
  {
    id: 'aurelia',
    name: 'Aurelische Republik',
    shortName: 'Aurelia',
    color: 'rose',
    emblemUrl: null,
  },
  {
    id: 'nordmark',
    name: 'Nordmark-Kollektiv',
    shortName: 'Nordmark',
    color: 'sky',
    emblemUrl: null,
  },
  {
    id: 'salzkueste',
    name: 'Salzküsten-Liga',
    shortName: 'Salzküste',
    color: 'lime',
    emblemUrl: null,
  },
]

const entry = (id: string, patch: Partial<HistoryEntry> = {}): HistoryEntry => ({
  id,
  name: `Partie ${id}`,
  endedAt: '2026-10-27T21:10:00Z',
  result: 'victory',
  placement: 1,
  playerCount: 2,
  rounds: 48,
  factionId: 'eisenbund',
  opponents: ['Admiral Kessler (KI)'],
  ...patch,
})

function profileData(patch: Partial<ProfileData> = {}): ProfileData {
  return {
    profile: {
      id: 'p1',
      displayName: 'Björn',
      avatarUrl: null,
      memberSince: '2026-06-12T00:00:00Z',
      favoriteFactionId: 'eisenbund',
    },
    stats: { gamesPlayed: 3, wins: 2, citiesCaptured: 12, unitsBuilt: 40, longestGameRounds: 63 },
    factionStats: [
      { factionId: 'eisenbund', gamesPlayed: 2, wins: 2 },
      { factionId: 'aurelia', gamesPlayed: 0, wins: 0 },
      { factionId: 'nordmark', gamesPlayed: 1, wins: 0 },
      { factionId: 'salzkueste', gamesPlayed: 0, wins: 0 },
    ],
    history: [
      entry('h1', {
        name: 'Rußige Pfade',
        opponents: ['Lena Hartmann', 'Zechenmeister Brandt (KI)'],
        playerCount: 3,
      }),
      entry('h2', {
        name: 'Gegen die Republik',
        result: 'defeat',
        placement: 2,
        factionId: 'nordmark',
        rounds: 63,
      }),
    ],
    hasMoreHistory: true,
    nextCursor: 'c1',
    factions: FACTIONS,
    ...patch,
  }
}

describe('Profil', () => {
  it('zeigt Bilanz und Verlauf und lädt ältere Partien nach, bis nichts mehr kommt', async () => {
    const { calls } = mockApi({
      'GET /profile': () => ({ json: profileData() }),
      'GET /profile?cursor=c1': () => ({
        json: profileData({
          history: [entry('h3', { name: 'Sonntagsfeldzug', endedAt: '2026-09-21T17:40:00Z' })],
          hasMoreHistory: false,
          nextCursor: null,
        }),
      }),
    })
    renderApp('/profil')
    expect(screen.getByText('Lade Dienstakte …')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Björn' })).toBeInTheDocument()
    expect(screen.getByText('Mitglied seit Juni 2026')).toBeInTheDocument()
    expect(screen.getByText('67 %')).toBeInTheDocument()
    expect(screen.getByText('Rußige Pfade')).toBeInTheDocument()
    expect(screen.getByText('gegen Lena Hartmann, Zechenmeister Brandt (KI)')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Mehr anzeigen' }))
    expect(await screen.findByText('Sonntagsfeldzug')).toBeInTheDocument()
    expect(screen.getByText('Rußige Pfade')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mehr anzeigen' })).not.toBeInTheDocument()
    expect(calls.filter((c) => c.path.startsWith('/profile')).map((c) => c.path)).toEqual([
      '/profile',
      '/profile?cursor=c1',
    ])
  })

  it('zeigt einem neuen Spieler die Leerzustände', async () => {
    mockApi({
      'GET /profile': () => ({
        json: profileData({
          profile: { ...profileData().profile, favoriteFactionId: null },
          stats: {
            gamesPlayed: 0,
            wins: 0,
            citiesCaptured: 0,
            unitsBuilt: 0,
            longestGameRounds: 0,
          },
          factionStats: FACTIONS.map((f) => ({ factionId: f.id, gamesPlayed: 0, wins: 0 })),
          history: [],
          hasMoreHistory: false,
          nextCursor: null,
        }),
      }),
    })
    renderApp('/profil')
    expect(await screen.findByText('Noch keine Partie beendet')).toBeInTheDocument()
    expect(screen.getAllByText('Noch nicht gespielt')).toHaveLength(4)
    expect(screen.queryByText(/Lieblingsfraktion/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mehr anzeigen' })).not.toBeInTheDocument()
  })

  it('meldet Ladefehler mit erneutem Versuch', async () => {
    let fail = true
    mockApi({
      'GET /profile': () =>
        fail ? error(500, 'UNKNOWN', 'Der Server hat ein Problem.') : { json: profileData() },
    })
    renderApp('/profil')
    expect(await screen.findByRole('alert')).toHaveTextContent('Der Server hat ein Problem.')
    fail = false
    await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Björn' })).toBeInTheDocument()
  })

  it('ändert den Anzeigenamen; Profil und Shell zeigen den neuen Namen, Fehler als Meldung', async () => {
    let name = 'Björn'
    let taken = false
    const { calls } = mockApi({
      'GET /profile': () => ({
        json: profileData({ profile: { ...profileData().profile, displayName: name } }),
      }),
      'PATCH /profile': (body) => {
        if (taken) return error(409, 'NAME_TAKEN', 'Dieser Name ist bereits vergeben.')
        name = (body as { displayName: string }).displayName
        return { json: { ...testUser, name } satisfies Me }
      },
    })
    const { queryClient } = renderApp('/profil')
    await userEvent.click(await screen.findByRole('button', { name: /Profil bearbeiten/ }))
    const dialog = screen.getByRole('dialog', { name: 'Profil bearbeiten' })
    const input = within(dialog).getByLabelText(/^Anzeigename/)
    await userEvent.clear(input)
    await userEvent.type(input, 'Björn der Große')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Speichern' }))
    expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({
      displayName: 'Björn der Große',
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Anzeigename gespeichert')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Björn der Große' }),
    ).toBeInTheDocument()
    // Shell: das Benutzermenü liest /me
    expect(queryClient.getQueryData<Me>(meKey)?.name).toBe('Björn der Große')

    taken = true
    await userEvent.click(screen.getByRole('button', { name: /Profil bearbeiten/ }))
    const again = screen.getByRole('dialog', { name: 'Profil bearbeiten' })
    await userEvent.type(within(again).getByLabelText(/^Anzeigename/), 'x')
    await userEvent.click(within(again).getByRole('button', { name: 'Speichern' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Dieser Name ist bereits vergeben.')
  })

  it('lädt ein Bild hoch und entfernt es wieder', async () => {
    let avatarUrl: string | null = null
    const { calls } = mockApi({
      'GET /profile': () => ({
        json: profileData({ profile: { ...profileData().profile, avatarUrl } }),
      }),
      'POST /profile/avatar': () => {
        avatarUrl = '/uploads/avatars/p1-abc.png'
        return { json: { ...testUser, avatarUrl } }
      },
      'DELETE /profile/avatar': () => {
        avatarUrl = null
        return { json: testUser }
      },
    })
    renderApp('/profil')
    await userEvent.click(await screen.findByRole('button', { name: /Profil bearbeiten/ }))
    const dialog = screen.getByRole('dialog', { name: 'Profil bearbeiten' })
    const file = new File(['png'], 'ich.png', { type: 'image/png' })
    await userEvent.upload(dialog.querySelector<HTMLInputElement>('input[type=file]')!, file)
    // Erst der Zuschnitt: Querformat 400×200, Start ist das mittige Quadrat
    const cropper = screen.getByRole('dialog', { name: 'Bildausschnitt' })
    expect(calls.some((c) => c.path === '/profile/avatar')).toBe(false)
    const preview = within(cropper).getByAltText('Vorschau des neuen Profilbilds')
    Object.defineProperty(preview, 'naturalWidth', { value: 400 })
    Object.defineProperty(preview, 'naturalHeight', { value: 200 })
    fireEvent.load(preview)
    // Ganz nach rechts schieben (Pfeiltasten), dann übernehmen
    const stage = within(cropper).getByRole('application')
    for (let i = 0; i < 40; i++) fireEvent.keyDown(stage, { key: 'ArrowLeft' })
    await userEvent.click(within(cropper).getByRole('button', { name: 'Übernehmen' }))
    const upload = calls.find((c) => c.path === '/profile/avatar')!
    expect(upload.method).toBe('POST')
    const body = upload.body as FormData
    expect(body.get('avatar')).toBeInstanceOf(File)
    expect([body.get('cropX'), body.get('cropY'), body.get('cropSize')]).toEqual([
      '200',
      '0',
      '200',
    ])
    expect(await screen.findByRole('status')).toHaveTextContent('Bild gespeichert')
    // Zurück im Profil-Dialog; nach dem Neuladen gibt es „Bild entfernen“
    const back = screen.getByRole('dialog', { name: 'Profil bearbeiten' })
    await userEvent.click(await within(back).findByRole('button', { name: /Bild entfernen/ }))
    expect(calls.some((c) => c.method === 'DELETE' && c.path === '/profile/avatar')).toBe(true)
    expect(await screen.findByRole('status')).toHaveTextContent('Bild entfernt')
  })

  it('Zuschnitt abbrechen lädt nichts hoch und führt zurück', async () => {
    const { calls } = mockApi({ 'GET /profile': () => ({ json: profileData() }) })
    renderApp('/profil')
    await userEvent.click(await screen.findByRole('button', { name: /Profil bearbeiten/ }))
    const dialog = screen.getByRole('dialog', { name: 'Profil bearbeiten' })
    await userEvent.type(within(dialog).getByLabelText(/^Anzeigename/), 'x')
    const file = new File(['png'], 'ich.png', { type: 'image/png' })
    await userEvent.upload(dialog.querySelector<HTMLInputElement>('input[type=file]')!, file)
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Bildausschnitt' })).getByRole('button', {
        name: 'Abbrechen',
      }),
    )
    const back = screen.getByRole('dialog', { name: 'Profil bearbeiten' })
    // Der getippte Name bleibt erhalten
    expect(within(back).getByLabelText(/^Anzeigename/)).toHaveValue(
      `${profileData().profile.displayName}x`,
    )
    expect(calls.some((c) => c.path === '/profile/avatar')).toBe(false)
  })

  it('weist zu große Bilder ab, ohne sie hochzuladen', async () => {
    const { calls } = mockApi({ 'GET /profile': () => ({ json: profileData() }) })
    renderApp('/profil')
    await userEvent.click(await screen.findByRole('button', { name: /Profil bearbeiten/ }))
    const dialog = screen.getByRole('dialog', { name: 'Profil bearbeiten' })
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'gross.png', { type: 'image/png' })
    await userEvent.upload(dialog.querySelector<HTMLInputElement>('input[type=file]')!, big)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Das Bild ist zu groß (höchstens 10 MB).',
    )
    expect(screen.queryByRole('dialog', { name: 'Bildausschnitt' })).toBeNull()
    expect(calls.some((c) => c.path === '/profile/avatar')).toBe(false)
  })
})

describe('Einstellungen', () => {
  const settingsPuts = (calls: { method: string; path: string; body: unknown }[]) =>
    calls.filter((c) => c.method === 'PUT' && c.path === '/settings')

  it('speichert Änderungen entprellt mit dem vollständigen Objekt', async () => {
    const { calls } = mockApi({
      'PUT /settings': (body) => ({ json: { ...testSettings(), settings: body } }),
    })
    renderApp('/einstellungen')
    expect(screen.getByText('Lade Einstellungen …')).toBeInTheDocument()
    await userEvent.click(await screen.findByRole('switch', { name: 'Partie beendet per E-Mail' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Sofort' }))
    expect(screen.getByRole('status')).toHaveTextContent('Gespeichert')
    await waitFor(() => expect(settingsPuts(calls)).toHaveLength(1))
    const expected = testSettings((s) => {
      s.notifications.matchEnded.email = true
      s.notifications.emailDelayHours = 0
    }).settings
    expect(settingsPuts(calls)[0]!.body).toEqual(expected)
  })

  it('wendet Farbschema und „Animationen reduzieren“ sofort an', async () => {
    mockApi({ 'PUT /settings': (body) => ({ json: { ...testSettings(), settings: body } }) })
    renderApp('/einstellungen')
    await userEvent.click(await screen.findByRole('button', { name: /^Darstellung/ }))
    // Query-Observer werden per setTimeout benachrichtigt, das Schema folgt einen Takt später
    await userEvent.click(screen.getByRole('radio', { name: 'Dunkel' }))
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'))
    expect(localStorage.getItem('dos.theme')).toBe('dark')
    await userEvent.click(screen.getByRole('switch', { name: 'Animationen reduzieren' }))
    await waitFor(() => expect(document.documentElement).toHaveClass('dos-reduce-motion'))
    await userEvent.click(screen.getByRole('radio', { name: 'Hell' }))
    await waitFor(() => expect(document.documentElement).not.toHaveClass('dark'))
  })

  it('speichert den Schalter „Rundenbericht zu Zugbeginn“', async () => {
    const { calls } = mockApi({
      'PUT /settings': (body) => ({ json: { ...testSettings(), settings: body } }),
    })
    renderApp('/einstellungen')
    await userEvent.click(await screen.findByRole('button', { name: /^Darstellung/ }))
    const toggle = screen.getByRole('switch', { name: 'Rundenbericht zu Zugbeginn' })
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(toggle)
    await waitFor(() =>
      expect(calls.find((c) => c.method === 'PUT')?.body).toMatchObject({
        display: { turnReport: false },
      }),
    )
  })

  it('wechselt die Sprache sofort und speichert sie im Profil', async () => {
    const { calls } = mockApi({
      'PUT /locale': (body) => ({ json: { ...testUser, ...(body as object) } }),
    })
    const { queryClient } = renderApp('/einstellungen')
    await userEvent.click(await screen.findByRole('button', { name: /^Darstellung/ }))
    await userEvent.click(screen.getByRole('radio', { name: 'English' }))
    await waitFor(() => expect(document.documentElement.lang).toBe('en'))
    expect(localStorage.getItem('dos.locale')).toBe('en')
    expect(screen.getByRole('radiogroup', { name: 'Language' })).toBeInTheDocument()
    await waitFor(() => expect(calls.find((c) => c.path === '/locale')?.body).toEqual({ locale: 'en' }))
    expect(queryClient.getQueryData<Me>(meKey)?.locale).toBe('en')
  })

  it('übernimmt nach der Anmeldung die gespeicherte Sprache des Profils', async () => {
    mockApi({})
    renderApp('/', { user: { ...testUser, locale: 'en' } })
    await waitFor(() => expect(document.documentElement.lang).toBe('en'))
    expect(localStorage.getItem('dos.locale')).toBe('en')
  })

  it('übernimmt nach der Anmeldung das gespeicherte Farbschema des Servers', async () => {
    localStorage.setItem('dos.theme', 'light')
    mockApi({ 'GET /settings': () => ({ json: testSettings((s) => (s.display.theme = 'dark')) }) })
    renderApp('/')
    await waitFor(() => expect(document.documentElement).toHaveClass('dark'))
    expect(localStorage.getItem('dos.theme')).toBe('dark')
  })

  it('meldet Speicherfehler und zeigt wieder den Stand des Servers', async () => {
    mockApi({
      'PUT /settings': () => error(500, 'UNKNOWN', 'Speichern fehlgeschlagen.'),
    })
    renderApp('/einstellungen')
    const toggle = await screen.findByRole('switch', { name: 'Partie beendet per E-Mail' })
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(await screen.findByRole('alert')).toHaveTextContent('Speichern fehlgeschlagen.')
    await waitFor(() =>
      expect(screen.getByRole('switch', { name: 'Partie beendet per E-Mail' })).toHaveAttribute(
        'aria-checked',
        'false',
      ),
    )
  })

  it('E-Mail ändern, Passwort ändern und Hinweis aus dem Bestätigungslink', async () => {
    const { calls } = mockApi({
      'POST /account/email': () => ({ json: { ok: true, pendingEmail: 'neu@example.de' } }),
      'POST /account/password': () =>
        error(403, 'WRONG_PASSWORD', 'Das aktuelle Passwort ist falsch.'),
    })
    renderApp('/einstellungen?email=bestaetigt')
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Deine neue E-Mail-Adresse ist bestätigt.',
    )
    await userEvent.click(await screen.findByRole('button', { name: /^Konto/ }))
    expect(screen.getByText('bjoern@dominion.test')).toBeInTheDocument()
    expect(screen.getByText('Du bist auf 2 Geräten angemeldet.')).toBeInTheDocument()

    const [changeEmail, changePassword] = screen.getAllByRole('button', { name: 'Ändern' })
    await userEvent.click(changeEmail!)
    const emailDialog = screen.getByRole('dialog', { name: 'E-Mail ändern' })
    await userEvent.type(
      within(emailDialog).getByLabelText(/^Neue E-Mail-Adresse/),
      'neu@example.de',
    )
    await userEvent.type(within(emailDialog).getByLabelText(/^Aktuelles Passwort/), 'geheim')
    await userEvent.click(within(emailDialog).getByRole('button', { name: 'Speichern' }))
    expect(calls.find((c) => c.path === '/account/email')?.body).toEqual({
      email: 'neu@example.de',
      currentPassword: 'geheim',
    })
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Wir haben dir einen Bestätigungslink an neu@example.de geschickt.',
    )

    await userEvent.click(changePassword!)
    const pwDialog = screen.getByRole('dialog', { name: 'Passwort ändern' })
    await userEvent.type(within(pwDialog).getByLabelText(/^Aktuelles Passwort/), 'altesPW')
    const [next, repeat] = within(pwDialog).getAllByLabelText(/^Neues Passwort/)
    await userEvent.type(next!, 'neuesPasswort')
    await userEvent.type(repeat!, 'neuesPasswort')
    await userEvent.click(within(pwDialog).getByRole('button', { name: 'Speichern' }))
    expect(calls.find((c) => c.path === '/account/password')?.body).toEqual({
      currentPassword: 'altesPW',
      newPassword: 'neuesPasswort',
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('Das aktuelle Passwort ist falsch.')
  })

  it('meldet auf allen Geräten ab und führt zur Anmeldung', async () => {
    const { calls } = mockApi({ 'POST /auth/logout-all': () => ({ json: { ok: true } }) })
    const { router } = renderApp('/einstellungen')
    await userEvent.click(await screen.findByRole('button', { name: /^Konto/ }))
    await userEvent.click(screen.getByRole('button', { name: /Auf allen Geräten abmelden/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/anmelden'))
    expect(calls.some((c) => c.path === '/auth/logout-all')).toBe(true)
    expect(await screen.findByText('Du wurdest auf allen Geräten abgemeldet.')).toBeInTheDocument()
  })

  it('zeigt eine unbestätigte Adresse und schickt die Bestätigung erneut', async () => {
    const { calls } = mockApi({
      'GET /settings': () => ({
        json: { ...testSettings(), account: { ...testSettings().account, emailVerified: false } },
      }),
      'POST /account/verify/resend': () => ({ json: { ok: true, alreadyVerified: false } }),
    })
    renderApp('/einstellungen?email=verifiziert')
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Deine E-Mail-Adresse ist bestätigt.',
    )
    await userEvent.click(await screen.findByRole('button', { name: /^Konto/ }))
    expect(screen.getByText('nicht bestätigt')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Bestätigung senden' }))
    expect(calls.some((c) => c.method === 'POST' && c.path === '/account/verify/resend')).toBe(true)
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Wir haben dir eine neue Bestätigungsmail geschickt.',
    )
  })

  it('zeigt eine bestätigte Adresse ohne Knopf', async () => {
    mockApi({})
    renderApp('/einstellungen')
    await userEvent.click(await screen.findByRole('button', { name: /^Konto/ }))
    expect(screen.getByText('bestätigt')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Bestätigung senden' })).not.toBeInTheDocument()
  })

  it('löscht das Konto nach doppelter Bestätigung', async () => {
    const { calls } = mockApi({
      'DELETE /account': () => ({ json: { ok: true, matchesTakenOver: 1 } }),
    })
    const { router } = renderApp('/einstellungen')
    await userEvent.click(await screen.findByRole('button', { name: /^Konto/ }))
    await userEvent.click(screen.getByRole('button', { name: /Konto löschen/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    const dialog = screen.getByRole('dialog', { name: 'Endgültig löschen' })
    await userEvent.type(within(dialog).getByRole('textbox'), 'Björn')
    // Ohne Passwort geht es nicht weiter
    expect(within(dialog).getByRole('button', { name: 'Konto löschen' })).toBeDisabled()
    await userEvent.type(within(dialog).getByLabelText('Aktuelles Passwort'), 'geheim')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Konto löschen' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/anmelden'))
    const call = calls.find((c) => c.method === 'DELETE' && c.path === '/account')
    expect(call?.body).toEqual({ currentPassword: 'geheim' })
    expect(
      await screen.findByText('Dein Konto wurde gelöscht. Laufende Partien führt eine KI weiter.'),
    ).toBeInTheDocument()
  })

  it('bleibt bei einem Fehler beim Löschen angemeldet', async () => {
    mockApi({ 'DELETE /account': () => error(500, 'UNKNOWN', 'Löschen fehlgeschlagen.') })
    const { router } = renderApp('/einstellungen')
    await userEvent.click(await screen.findByRole('button', { name: /^Konto/ }))
    await userEvent.click(screen.getByRole('button', { name: /Konto löschen/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Weiter' }))
    const dialog = screen.getByRole('dialog', { name: 'Endgültig löschen' })
    await userEvent.type(within(dialog).getByRole('textbox'), 'Björn')
    await userEvent.type(within(dialog).getByLabelText('Aktuelles Passwort'), 'geheim')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Konto löschen' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Löschen fehlgeschlagen.')
    expect(router.state.location.pathname).toBe('/einstellungen')
  })
})

describe('Einstellungen im Spielfeld', () => {
  it('überspringt die Wiederholung, wenn Gegnerzüge nicht automatisch abgespielt werden', async () => {
    const { calls } = mockApi({
      'GET /settings': () => ({ json: testSettings((s) => (s.display.autoplayReplay = false)) }),
      'GET /matches/demo/view': () => ({ json: demoView('replay') }),
      'POST /matches/demo/commands': () => ({ json: { view: demoView() } }),
    })
    renderApp('/partie/demo')
    await waitFor(() =>
      expect(calls.filter((c) => c.path === '/matches/demo/commands').map((c) => c.body)).toEqual([
        { type: 'skipReplay' },
      ]),
    )
  })

  it('spielt die Wiederholung mit der Vorgabe ab und blendet Kampfanimationen bei Bedarf aus', async () => {
    const { calls } = mockApi({
      'GET /settings': () => ({ json: testSettings((s) => (s.display.combatAnimations = false)) }),
      'GET /matches/demo/view': () => ({ json: demoView('replay') }),
    })
    renderApp('/partie/demo')
    await screen.findByRole('application', { name: 'Spielkarte' })
    await waitFor(() =>
      expect(screen.getByTestId('board-settings')).toHaveClass('dos-no-combat-fx'),
    )
    expect(calls.some((c) => c.path === '/matches/demo/commands')).toBe(false)
  })
})
