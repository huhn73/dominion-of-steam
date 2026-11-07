import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  AI_PERSONALITIES,
  type MatchDraft,
  SETUP_FACTIONS,
  SETUP_OPTIONS,
  type SetupData,
} from '@dos/shared/setup'
import type { WaitingRoomData } from '@dos/shared/lobby'
import { renderApp } from '../../test/renderApp'
import { mockApi, testUser } from '../../test/mockApi'

const draft: MatchDraft = {
  name: 'Die Kohleinseln II',
  mode: 'async',
  asyncTurnLimitHours: 24,
  liveTurnLimitMinutes: null,
  victoryCondition: 'capitals',
  roundLimit: 150,
  allowDuplicateFactions: false,
  seats: [{ kind: 'you' }, { kind: 'empty' }],
  fillEmptyWithAI: true,
  map: {
    size: 'medium',
    landShare: 45,
    neutralCities: 'normal',
    terrain: 'normal',
    seed: 'KOHLE-4417',
  },
  factionId: null,
}

const setupData: SetupData = {
  you: { id: testUser.id, name: 'Björn', avatarUrl: null },
  factions: SETUP_FACTIONS,
  aiPersonalities: AI_PERSONALITIES,
  friends: [
    { id: 'lena', name: 'Lena Hartmann', avatarUrl: null, status: 'online', lastSeen: null },
    {
      id: 'tobias',
      name: 'Tobias Brenner',
      avatarUrl: null,
      status: 'offline',
      lastSeen: '2026-10-29T21:14:00Z',
    },
  ],
  options: SETUP_OPTIONS,
  draft,
  inviteLink: 'http://localhost:8080/einladung/K7Q-2XM-H9P',
  reservationId: 'm-reserviert',
}

const room: WaitingRoomData = {
  status: 'waiting',
  factions: [],
  room: {
    matchId: 'm-reserviert',
    matchName: 'Die Kohleinseln II',
    isHost: true,
    inviteLink: setupData.inviteLink,
    rules: {
      mode: 'async',
      turnLimitLabel: { key: 'setup.hours', params: { count: 24 } },
      victoryCondition: { key: 'setup.victory.capitals.label' },
      allowDuplicateFactions: false,
    },
    map: {
      sizeLabel: { key: 'setup.size.medium' },
      width: 18,
      height: 12,
      landShare: 45,
      seed: 'KOHLE-5530',
    },
    fillEmptyWithAI: true,
    seats: [
      {
        kind: 'player',
        status: 'ready',
        name: 'Björn',
        avatarUrl: null,
        isYou: true,
        isHost: true,
        factionId: 'eisenbund',
      },
      {
        kind: 'invited',
        status: 'pending',
        name: 'Lena Hartmann',
        avatarUrl: null,
        isYou: false,
        isHost: false,
        factionId: null,
      },
    ],
  },
}

function withSetup(
  create: (body: unknown) => { status?: number; json: unknown } = () => ({
    status: 201,
    json: { matchId: 'm-reserviert', started: true },
  }),
) {
  return mockApi({
    'GET /setup': () => ({ json: setupData }),
    'POST /matches': create,
    'GET /matches/m-reserviert/room': () => ({ json: room }),
  })
}

const next = () => userEvent.click(screen.getByRole('button', { name: /^Weiter$/ }))

/** Schritte 1 und 2 mit Eisenbund durchlaufen, Schritt 3 ist offen */
async function toPlayers() {
  await screen.findByText('Mobilmachung')
  await next()
  await userEvent.click(screen.getByRole('radio', { name: /Eisenbund von Valdrin/ }))
  await next()
  await screen.findByText('Wer besetzt diesen Platz?')
}

beforeEach(() => {
  window.scrollTo = vi.fn() as never
})
afterEach(() => vi.unstubAllGlobals())

describe('Neue Partie', () => {
  it('zeigt einen Ladezustand, dann den Assistenten mit „Neue Partie“ aktiv', async () => {
    withSetup()
    renderApp('/neue-partie')
    expect(screen.getByText('Lade Einrichtung …')).toBeInTheDocument()
    expect(await screen.findByText('Mobilmachung')).toBeInTheDocument()
    expect(screen.getByText('Die Kohleinseln II')).toBeInTheDocument()
    const nav = screen.getAllByRole('navigation', { name: 'Hauptnavigation' })[0]!
    expect(within(nav).getByRole('button', { name: 'Neue Partie' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('meldet Ladefehler mit erneutem Versuch', async () => {
    mockApi({
      'GET /setup': () => ({
        status: 500,
        json: { error: { code: 'X', message: 'Server kaputt' } },
      }),
    })
    renderApp('/neue-partie')
    expect(await screen.findByText('Server kaputt')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeInTheDocument()
  })

  it('sperrt „Weiter“ ohne Namen und ohne Fraktion', async () => {
    withSetup()
    renderApp('/neue-partie')
    const name = await screen.findByPlaceholderText('z. B. Die Kohleinseln')
    await userEvent.clear(name)
    expect(screen.getByRole('button', { name: /^Weiter$/ })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Gib der Partie einen Namen.')
    expect(screen.getByText('Ohne Namen')).toBeInTheDocument()
    await userEvent.type(name, 'Ostfront')
    await next()
    expect(screen.getByRole('button', { name: /^Weiter$/ })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Wähle deine Fraktion.')
  })

  it('Ablauf 1: Solo-Partie gegen Admiral Kessler anlegen und zum Spielfeld wechseln', async () => {
    const { calls } = withSetup()
    const { router } = renderApp('/neue-partie')
    await toPlayers()
    await userEvent.click(screen.getByRole('button', { name: 'KI' }))
    const dialog = await screen.findByRole('dialog', { name: 'KI-Gegner wählen' })
    // Eisenbund ist die eigene Fraktion: dessen Persönlichkeiten sind gesperrt
    for (const name of ['Zechenmeister Brandt', 'Generalin Eisenhart'])
      expect(within(dialog).getByRole('button', { name: new RegExp(name) })).toBeDisabled()
    expect(within(dialog).getAllByText('Eisenbund ist schon vergeben')).toHaveLength(2)
    await userEvent.click(within(dialog).getByRole('button', { name: /Admiral Kessler/ }))
    await userEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Schwierigkeit Admiral Kessler' })).getByRole(
        'radio',
        { name: 'Schwer' },
      ),
    )
    await next()
    await next()
    expect(
      screen.getByText('Nur KI-Gegner: Die Partie startet sofort als Solo-Partie.'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Partie erstellen/ }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/partie/m-reserviert'))
    const post = calls.find((c) => c.method === 'POST' && c.path === '/matches')!
    expect(post.body).toEqual({
      reservationId: 'm-reserviert',
      draft: {
        ...draft,
        factionId: 'eisenbund',
        seats: [{ kind: 'you' }, { kind: 'ai', personalityId: 'kessler', difficulty: 'hard' }],
      },
    })
  })

  it('Ablauf 2: Freund einladen, Link kopieren und in den Warteraum wechseln', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) }
    vi.stubGlobal('navigator', { ...navigator, clipboard, share: undefined })
    withSetup(() => ({ status: 201, json: { matchId: 'm-reserviert', started: false } }))
    const { router } = renderApp('/neue-partie')
    await toPlayers()
    await userEvent.click(screen.getByRole('button', { name: 'Freund' }))
    const dialog = await screen.findByRole('dialog', { name: 'Freund einladen' })
    await userEvent.click(within(dialog).getByRole('button', { name: /Lena Hartmann/ }))

    await userEvent.click(screen.getByRole('button', { name: /Kopieren/ }))
    expect(clipboard.writeText).toHaveBeenCalledWith(setupData.inviteLink)
    expect(await screen.findByText('Link kopiert')).toBeInTheDocument()
    // Ohne Web Share API kopiert „Teilen“ den Link
    clipboard.writeText.mockClear()
    await userEvent.click(screen.getByRole('button', { name: /Teilen/ }))
    expect(clipboard.writeText).toHaveBeenCalledWith(setupData.inviteLink)

    await next()
    await next()
    await userEvent.click(screen.getByRole('button', { name: /Partie erstellen/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/warteraum/m-reserviert'))
    expect(await screen.findByRole('heading', { name: 'Die Kohleinseln II' })).toBeInTheDocument()
    expect(screen.getByText('Lena Hartmann')).toBeInTheDocument()
    expect(screen.getByText('Eingeladen')).toBeInTheDocument()
  })

  it('teilt den Link über das Teilen-Menü des Geräts', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share, clipboard: { writeText: vi.fn() } })
    withSetup()
    renderApp('/neue-partie')
    await toPlayers()
    await userEvent.click(screen.getByRole('button', { name: /Teilen/ }))
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: setupData.inviteLink }))
  })

  it('zeigt Fehler des Servers, ohne die Eingaben zu verlieren', async () => {
    withSetup(() => ({
      status: 422,
      json: {
        error: {
          code: 'INVALID_SETUP',
          message: 'Du kannst nur Spieler aus deiner Freundesliste einladen.',
        },
      },
    }))
    const { router } = renderApp('/neue-partie')
    await toPlayers()
    await next()
    await next()
    await userEvent.click(screen.getByRole('button', { name: /Partie erstellen/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Du kannst nur Spieler aus deiner Freundesliste einladen.',
    )
    expect(router.state.location.pathname).toBe('/neue-partie')
    expect(screen.getByRole('button', { name: /Partie erstellen/ })).toBeEnabled()
    expect(screen.getByText('Die Kohleinseln II', { selector: 'span' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Meldung schließen' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('bietet fünf Kartenstufen und zieht das Rundenlimit mit der Stufe nach', async () => {
    withSetup()
    renderApp('/neue-partie')
    await toPlayers()
    await next()
    await screen.findByLabelText('Kartencode')
    const sizes = within(screen.getAllByRole('radiogroup')[0]!).getAllByRole('radio')
    expect(sizes.map((r) => r.textContent)).toEqual([
      expect.stringContaining('Klein'),
      expect.stringContaining('Mittel'),
      expect.stringContaining('Groß'),
      expect.stringContaining('Riesig'),
      expect.stringContaining('Imperium'),
    ])
    expect(sizes[4]).toHaveTextContent('200×200 · 40.000 Felder')
    expect(sizes[4]).toHaveTextContent('Rundenlimit 500')
    // World shape: continent is preselected, islands can be chosen
    const shapes = within(screen.getByRole('radiogroup', { name: 'Weltform' })).getAllByRole(
      'radio',
    )
    expect(shapes.map((r) => r.textContent)).toEqual(['Kontinent', 'Inseln', 'Archipel'])
    expect(shapes[0]).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(shapes[1]!)
    expect(shapes[1]).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText(/Der Landanteil bestimmt die Inselgröße/)).toBeInTheDocument()
    await userEvent.click(sizes[4]!)
    await next()
    expect(screen.getByText(/Imperium · 200×200 · 40.000 Felder/)).toBeInTheDocument()
    expect(screen.getByText('Inseln')).toBeInTheDocument()
    // Islands suggest the victory condition „Vorherrschaft“ instead of the default
    expect(screen.getByText('Vorherrschaft')).toBeInTheDocument()
    // Back to the rules: the limit follows the size and the hint names it
    await userEvent.click(screen.getAllByRole('button', { name: /Ändern/ })[0]!)
    expect(screen.getByRole('radio', { name: /Vorherrschaft/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await userEvent.click(screen.getByRole('radio', { name: /Rundenlimit/ }))
    expect(screen.getByText('Empfohlen für Imperium: 500')).toBeInTheDocument()
    expect(
      within(screen.getByRole('radiogroup', { name: 'Anzahl Runden' })).getByRole('radio', {
        name: '500',
      }),
    ).toHaveAttribute('aria-checked', 'true')
  })

  it('würfelt einen Kartencode im Format des Kartengenerators', async () => {
    withSetup()
    renderApp('/neue-partie')
    await toPlayers()
    await next()
    const seed = screen.getByLabelText('Kartencode')
    expect(seed).toHaveValue('KOHLE-4417')
    await userEvent.click(screen.getByRole('button', { name: /Neu würfeln/ }))
    expect((seed as HTMLInputElement).value).toMatch(/^[A-Z]+-\d{4}$/)
  })

  it('kehrt bei „Abbrechen“ mit unverändertem Entwurf in die Lobby zurück', async () => {
    withSetup()
    const { router } = renderApp('/neue-partie')
    await screen.findByText('Mobilmachung')
    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(router.state.location.pathname).toBe('/')
  })

  it('leitet eine wartende Partie vom Spielfeld in den Warteraum', async () => {
    mockApi({
      'GET /matches/m-reserviert/view': () => ({
        status: 409,
        json: {
          error: { code: 'MATCH_WAITING', message: 'Die Partie wartet noch auf Mitspieler.' },
        },
      }),
      'GET /matches/m-reserviert/room': () => ({ json: room }),
    })
    const { router } = renderApp('/partie/m-reserviert')
    await waitFor(() => expect(router.state.location.pathname).toBe('/warteraum/m-reserviert'))
  })
})
