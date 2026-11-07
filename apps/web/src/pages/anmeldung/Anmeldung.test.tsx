import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../../test/renderApp'
import { mockApi, testUser } from '../../test/mockApi'
import { safeNext } from '../../data/session'

afterEach(() => vi.unstubAllGlobals())

const notAuthenticated = () => ({
  status: 401,
  json: { error: { code: 'NOT_AUTHENTICATED', message: 'Bitte melde dich an.' } },
})

describe('Zugangsschutz', () => {
  it('leitet ohne Anmeldung zur Anmeldung und merkt sich das Ziel', async () => {
    mockApi({ 'GET /me': notAuthenticated })
    const { router } = renderApp('/fraktionen?x=1', { user: undefined })
    expect(await screen.findByRole('heading', { name: 'Anmelden' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/anmelden')
    expect(router.state.location.search).toBe(`?weiter=${encodeURIComponent('/fraktionen?x=1')}`)
  })

  it('lädt den angemeldeten Spieler vom Server', async () => {
    mockApi({ 'GET /me': () => ({ json: { ...testUser, name: 'Lena Hartmann' } }) })
    renderApp('/', { user: undefined })
    expect(screen.getByText('Lade …')).toBeInTheDocument()
    const trigger = await screen.findByRole('button', { name: 'Benutzermenü für Lena Hartmann' })
    expect(trigger).toHaveTextContent('LH')
  })

  it('führt bei abgelaufener Sitzung (401) zur Anmeldung', async () => {
    mockApi({ 'GET /matches/demo/view': notAuthenticated })
    const { router } = renderApp('/partie/demo')
    expect(await screen.findByRole('heading', { name: 'Anmelden' })).toBeInTheDocument()
    expect(router.state.location.search).toBe(`?weiter=${encodeURIComponent('/partie/demo')}`)
  })

  it('schickt angemeldete Spieler von der Anmeldung weiter', async () => {
    mockApi({})
    const { router } = renderApp('/anmelden?weiter=%2Ffraktionen')
    await waitFor(() => expect(router.state.location.pathname).toBe('/fraktionen'))
  })

  it('akzeptiert als Ziel nur Pfade innerhalb der App', () => {
    expect(safeNext('/partie/demo')).toBe('/partie/demo')
    expect(safeNext('//boese.example')).toBe('/')
    expect(safeNext('https://boese.example')).toBe('/')
    expect(safeNext('/anmelden')).toBe('/')
    expect(safeNext(null)).toBe('/')
  })
})

describe('Anmeldung', () => {
  it('prüft die Eingaben, bevor sie etwas sendet', async () => {
    const { calls } = mockApi({})
    renderApp('/anmelden', { user: null })
    await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }))
    expect(screen.getByLabelText('E-Mail-Adresse')).toHaveAccessibleDescription(
      'Bitte gib deine E-Mail-Adresse ein.',
    )
    expect(screen.getByLabelText('Passwort')).toHaveAccessibleDescription(
      'Bitte gib dein Passwort ein.',
    )
    await userEvent.type(screen.getByLabelText('E-Mail-Adresse'), 'kein-at')
    await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }))
    expect(screen.getByText('Bitte gib eine gültige E-Mail-Adresse ein.')).toBeInTheDocument()
    expect(calls.filter((c) => c.path.startsWith('/auth'))).toHaveLength(0)
  })

  it('zeigt Fehler des Servers', async () => {
    mockApi({
      'POST /auth/login': () => ({
        status: 401,
        json: {
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'E-Mail-Adresse oder Passwort ist falsch.',
          },
        },
      }),
    })
    const { router } = renderApp('/anmelden', { user: null })
    await userEvent.type(screen.getByLabelText('E-Mail-Adresse'), 'bjoern@dominion.test')
    await userEvent.type(screen.getByLabelText('Passwort'), 'falsch')
    await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-Mail-Adresse oder Passwort ist falsch.',
    )
    expect(router.state.location.pathname).toBe('/anmelden')
  })

  it('meldet an und führt zur ursprünglich gewünschten Seite', async () => {
    const { calls } = mockApi({ 'POST /auth/login': () => ({ json: testUser }) })
    const { router } = renderApp('/anmelden?weiter=%2Fprofil', { user: null })
    await userEvent.type(screen.getByLabelText('E-Mail-Adresse'), ' Bjoern@Dominion.test ')
    await userEvent.type(screen.getByLabelText('Passwort'), 'dampfmaschine')
    await userEvent.click(screen.getByLabelText('Passwort anzeigen'))
    expect(screen.getByLabelText('Passwort')).toHaveAttribute('type', 'text')
    await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/profil'))
    expect(
      await screen.findByRole('button', { name: 'Benutzermenü für Björn' }),
    ).toBeInTheDocument()
    expect(calls.find((c) => c.path === '/auth/login')?.body).toMatchObject({
      password: 'dampfmaschine',
    })
  })

  it('verlinkt die Registrierung und behält das Ziel', async () => {
    mockApi({})
    const { router } = renderApp('/anmelden?weiter=%2Fprofil', { user: null })
    await userEvent.click(screen.getByRole('link', { name: 'Jetzt registrieren' }))
    expect(router.state.location.pathname).toBe('/registrieren')
    expect(router.state.location.search).toBe('?weiter=%2Fprofil')
    expect(screen.getByRole('heading', { name: 'Konto anlegen' })).toBeInTheDocument()
  })
})

describe('Registrierung', () => {
  const fill = async (name: string, email: string, password: string) => {
    if (name) await userEvent.type(screen.getByLabelText('Name'), name)
    if (email) await userEvent.type(screen.getByLabelText('E-Mail-Adresse'), email)
    if (password) await userEvent.type(screen.getByLabelText('Passwort'), password)
    await userEvent.click(screen.getByRole('button', { name: 'Registrieren' }))
  }

  it('prüft Name, E-Mail-Adresse und Passwortlänge', async () => {
    const { calls } = mockApi({})
    renderApp('/registrieren', { user: null })
    await fill('Bo', 'bo@x', '1234567')
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription(
      'Der Name muss 3 bis 24 Zeichen lang sein.',
    )
    expect(screen.getByLabelText('E-Mail-Adresse')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Passwort')).toHaveAccessibleDescription(
      'Das Passwort muss mindestens 8 Zeichen lang sein.',
    )
    expect(calls.filter((c) => c.path.startsWith('/auth'))).toHaveLength(0)
  })

  it('zeigt vergebene E-Mail-Adressen am Feld', async () => {
    mockApi({
      'POST /auth/register': () => ({
        status: 409,
        json: {
          error: { code: 'EMAIL_TAKEN', message: 'Diese E-Mail-Adresse ist bereits registriert.' },
        },
      }),
    })
    renderApp('/registrieren', { user: null })
    await fill('Neuer Kapitän', 'bjoern@dominion.test', 'dampfmaschine')
    await waitFor(() =>
      expect(screen.getByLabelText('E-Mail-Adresse')).toHaveAccessibleDescription(
        'Diese E-Mail-Adresse ist bereits registriert.',
      ),
    )
  })

  it('legt das Konto an, führt in die Lobby und erinnert an die Bestätigungsmail', async () => {
    const created = {
      ...testUser,
      id: 'neu',
      name: 'Neuer Kapitän',
      email: 'neu@dominion.test',
      emailVerified: false,
    }
    const { calls } = mockApi({ 'POST /auth/register': () => ({ status: 201, json: created }) })
    const { router } = renderApp('/registrieren', { user: null })
    await fill('Neuer Kapitän', 'neu@dominion.test', 'dampfmaschine')
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(
      await screen.findByRole('button', { name: 'Benutzermenü für Neuer Kapitän' }),
    ).toHaveTextContent('NK')
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Konto angelegt. Wir haben dir eine Bestätigungsmail an neu@dominion.test geschickt.',
    )
    const notice = screen.getByRole('region', { name: 'E-Mail-Adresse bestätigen' })
    expect(notice).toHaveTextContent('Bitte bestätige deine E-Mail-Adresse neu@dominion.test')
    expect(calls.find((c) => c.path === '/auth/register')?.body).toEqual({
      displayName: 'Neuer Kapitän',
      email: 'neu@dominion.test',
      password: 'dampfmaschine',
      locale: 'de',
    })
  })
})

describe('Passwort vergessen', () => {
  it('verlinkt von der Anmeldung, nimmt die Adresse mit und bestätigt den Versand', async () => {
    const { calls } = mockApi({ 'POST /auth/forgot': () => ({ json: { ok: true } }) })
    const { router } = renderApp('/anmelden', { user: null })
    await userEvent.type(screen.getByLabelText('E-Mail-Adresse'), 'bjoern@dominion.test')
    await userEvent.click(screen.getByRole('link', { name: 'Passwort vergessen?' }))
    expect(router.state.location.pathname).toBe('/passwort-vergessen')
    expect(screen.getByRole('heading', { name: 'Passwort vergessen' })).toBeInTheDocument()
    expect(screen.getByLabelText('E-Mail-Adresse')).toHaveValue('bjoern@dominion.test')
    await userEvent.click(screen.getByRole('button', { name: 'Link anfordern' }))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Wenn zu bjoern@dominion.test ein Konto gehört, haben wir dir gerade einen Link geschickt.',
    )
    expect(calls.find((c) => c.path === '/auth/forgot')?.body).toEqual({
      email: 'bjoern@dominion.test',
    })
    expect(screen.queryByRole('button', { name: 'Link anfordern' })).not.toBeInTheDocument()
  })

  it('prüft die Adresse und zeigt Fehler des Servers', async () => {
    const { calls } = mockApi({
      'POST /auth/forgot': () => ({
        status: 503,
        json: {
          error: {
            code: 'MAIL_UNAVAILABLE',
            message: 'E-Mails können gerade nicht verschickt werden.',
          },
        },
      }),
    })
    renderApp('/passwort-vergessen', { user: null })
    await userEvent.click(screen.getByRole('button', { name: 'Link anfordern' }))
    expect(screen.getByLabelText('E-Mail-Adresse')).toHaveAccessibleDescription(
      'Bitte gib deine E-Mail-Adresse ein.',
    )
    expect(calls).toHaveLength(0)
    await userEvent.type(screen.getByLabelText('E-Mail-Adresse'), 'bjoern@dominion.test')
    await userEvent.click(screen.getByRole('button', { name: 'Link anfordern' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-Mails können gerade nicht verschickt werden.',
    )
  })

  it('setzt mit dem Link ein neues Passwort und meldet an', async () => {
    const { calls } = mockApi({ 'POST /auth/reset': () => ({ json: testUser }) })
    const { router } = renderApp('/passwort-zuruecksetzen?token=abc123', { user: null })
    expect(screen.getByRole('heading', { name: 'Neues Passwort' })).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Neues Passwort'), 'kurz')
    await userEvent.click(screen.getByRole('button', { name: 'Passwort speichern' }))
    expect(screen.getByLabelText('Neues Passwort')).toHaveAccessibleDescription(
      'Das Passwort muss mindestens 8 Zeichen lang sein.',
    )
    await userEvent.clear(screen.getByLabelText('Neues Passwort'))
    await userEvent.type(screen.getByLabelText('Neues Passwort'), 'neues-passwort')
    await userEvent.type(screen.getByLabelText('Passwort wiederholen'), 'anders')
    await userEvent.click(screen.getByRole('button', { name: 'Passwort speichern' }))
    expect(screen.getByLabelText('Passwort wiederholen')).toHaveAccessibleDescription(
      'Die Passwörter stimmen nicht überein.',
    )
    expect(calls).toHaveLength(0)
    await userEvent.clear(screen.getByLabelText('Passwort wiederholen'))
    await userEvent.type(screen.getByLabelText('Passwort wiederholen'), 'neues-passwort')
    await userEvent.click(screen.getByRole('button', { name: 'Passwort speichern' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(calls.find((c) => c.path === '/auth/reset')?.body).toEqual({
      token: 'abc123',
      password: 'neues-passwort',
    })
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Passwort geändert. Du bist angemeldet, andere Geräte wurden abgemeldet.',
    )
  })

  it('meldet ungültige oder fehlende Links mit dem Weg zu einem neuen', async () => {
    mockApi({
      'POST /auth/reset': () => ({
        status: 422,
        json: {
          error: {
            code: 'INVALID_TOKEN',
            message: 'Der Link ist ungültig oder abgelaufen. Fordere einen neuen an.',
          },
        },
      }),
    })
    const { router } = renderApp('/passwort-zuruecksetzen?token=alt', { user: null })
    await userEvent.type(screen.getByLabelText('Neues Passwort'), 'neues-passwort')
    await userEvent.type(screen.getByLabelText('Passwort wiederholen'), 'neues-passwort')
    await userEvent.click(screen.getByRole('button', { name: 'Passwort speichern' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Der Link ist ungültig oder abgelaufen. Fordere einen neuen an.',
    )
    await userEvent.click(screen.getByRole('link', { name: 'Neuen Link anfordern' }))
    expect(router.state.location.pathname).toBe('/passwort-vergessen')

    renderApp('/passwort-zuruecksetzen', { user: null })
    expect(screen.getByRole('alert')).toHaveTextContent('Der Link ist unvollständig.')
  })
})

describe('Abmelden', () => {
  it('meldet über das Benutzermenü ab und zeigt die Anmeldung', async () => {
    const { calls } = mockApi({ 'POST /auth/logout': () => ({ json: { ok: true } }) })
    const { router } = renderApp('/fraktionen')
    await userEvent.click(screen.getByRole('button', { name: 'Benutzermenü für Björn' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Abmelden' }))
    expect(await screen.findByRole('heading', { name: 'Anmelden' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/anmelden')
    expect(router.state.location.search).toBe('')
    expect(calls.some((c) => c.method === 'POST' && c.path === '/auth/logout')).toBe(true)
  })
})
