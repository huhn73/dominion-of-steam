import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../test/renderApp'
import { mockApi, testSettings, testUser } from '../test/mockApi'
import { lobbyData } from '../test/lobbyData'
import { gestureCounts, musicForPath, uiSoundFor } from './AudioProvider'
import { lobbyChanges } from './useLobbySounds'

afterEach(() => vi.unstubAllGlobals())

describe('Menümusik nach Route', () => {
  it('kennt Lobby-, Setup- und Spielfeldseiten', () => {
    expect(musicForPath('/')).toBe('menu-lobby')
    expect(musicForPath('/fraktionen/eisenbund')).toBe('menu-lobby')
    expect(musicForPath('/einstellungen')).toBe('menu-lobby')
    expect(musicForPath('/neue-partie')).toBe('menu-setup')
    expect(musicForPath('/warteraum/abc')).toBe('menu-setup')
    expect(musicForPath('/einladung/tok')).toBe('menu-setup')
    expect(musicForPath('/partie/demo')).toBeNull()
  })
})

describe('Gesten zum Entsperren', () => {
  const nav = (hasBeenActive: boolean) => ({ userActivation: { hasBeenActive } }) as Navigator
  it('ignoriert Modifier-Tasten und folgt der Aktivierung des Browsers', () => {
    expect(gestureCounts(new KeyboardEvent('keydown', { key: 'Control' }), nav(true))).toBe(false)
    expect(gestureCounts(new KeyboardEvent('keydown', { key: 'a' }), nav(true))).toBe(true)
    expect(gestureCounts(new KeyboardEvent('keydown', { key: 'a' }), nav(false))).toBe(false)
    expect(gestureCounts(new MouseEvent('pointerdown'), nav(false))).toBe(false)
    expect(gestureCounts(new MouseEvent('pointerdown'), {} as Navigator)).toBe(true)
  })
})

describe('Oberflächen-Töne', () => {
  const el = (html: string) => {
    document.body.innerHTML = html
    return (
      document.body.firstElementChild!.querySelector('[data-t]') ?? document.body.firstElementChild
    )
  }
  it('unterscheidet Klick, Schalter, gesperrt und stumm', () => {
    expect(uiSoundFor(el('<button data-t>Ok</button>'))).toBe('ui-click')
    expect(uiSoundFor(el('<a href="/x" data-t>Link</a>'))).toBe('ui-click')
    expect(uiSoundFor(el('<button role="switch" aria-checked="false" data-t>S</button>'))).toBe(
      'ui-toggle',
    )
    expect(uiSoundFor(el('<div role="radiogroup"><button data-t>A</button></div>'))).toBe(
      'ui-toggle',
    )
    expect(uiSoundFor(el('<button disabled data-t>X</button>'))).toBe('ui-error')
    expect(uiSoundFor(el('<button data-sound="none" data-t>M</button>'))).toBeNull()
    expect(uiSoundFor(el('<input type="range" data-t>'))).toBeNull()
    expect(uiSoundFor(el('<p data-t>Text</p>'))).toBeNull()
  })
})

describe('Audio in der App', () => {
  it('spiegelt die Ton-Einstellungen, spielt Menümusik und Klicks', async () => {
    mockApi({
      'GET /settings': () => ({ json: testSettings((s) => (s.sound.muted = true)) }),
    })
    const { audio } = renderApp('/')
    await screen.findByText('Björn, an allen Fronten ist es ruhig.')
    await waitFor(() => expect(audio.volumes?.muted).toBe(true))
    expect(audio.music).toEqual(['menu-lobby'])
    await userEvent.click(screen.getByRole('button', { name: 'Benutzermenü für Björn' }))
    expect(audio.sfx).toContain('ui-click')
  })

  it('wechselt die Musik beim Routenwechsel und öffnet Dialoge hörbar', async () => {
    mockApi({})
    const { audio } = renderApp('/einstellungen')
    await userEvent.click(await screen.findByRole('button', { name: /^Konto/ }))
    expect(audio.music).toEqual(['menu-lobby'])
    await userEvent.click(screen.getAllByRole('button', { name: 'Ändern' })[0]!)
    await screen.findByRole('dialog', { name: 'E-Mail ändern' })
    await waitFor(() => expect(audio.sfx).toContain('ui-panel-open'))
  })

  it('wendet nach dem Anmelden die Einstellungen an und spielt Klicks (Cache wird beim Login geleert)', async () => {
    mockApi({
      'POST /auth/login': () => ({ json: testUser }),
      'GET /settings': () => ({ json: testSettings((s) => (s.sound.muted = true)) }),
      'PUT /settings': (body) => ({ json: { ...testSettings(), settings: body } }),
    })
    const { audio } = renderApp('/anmelden', { user: null })
    await userEvent.type(screen.getByLabelText('E-Mail-Adresse'), 'bjoern@dominion.test')
    await userEvent.type(screen.getByLabelText('Passwort'), 'dampfmaschine')
    expect(audio.sfx).toEqual([]) // public page: no click sounds
    await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }))
    await screen.findByText('Björn, an allen Fronten ist es ruhig.')
    await waitFor(() => expect(audio.volumes?.muted).toBe(true))
    expect(audio.music).toEqual(['menu-lobby'])
    await userEvent.click(screen.getByRole('button', { name: 'Benutzermenü für Björn' }))
    expect(audio.sfx).toContain('ui-click')
    // The quick mute reaches the engine through the same subscription
    await userEvent.click(screen.getByRole('button', { name: 'Ton an' }))
    await waitFor(() => expect(audio.volumes?.muted).toBe(false))
  })

  it('macht beim Abmelden still und lässt die Engine entsperrt', async () => {
    mockApi({ 'POST /auth/logout': () => ({ json: { ok: true } }) })
    const { audio } = renderApp('/')
    await screen.findByText('Björn, an allen Fronten ist es ruhig.')
    expect(audio.music).toEqual(['menu-lobby'])
    await userEvent.click(screen.getByRole('button', { name: 'Benutzermenü für Björn' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Abmelden' }))
    await screen.findByRole('heading', { name: 'Anmelden' })
    expect(audio.calls.some((c) => c.method === 'stopAll')).toBe(true)
    expect(audio.calls.some((c) => c.method === 'dispose')).toBe(false)
    // Nothing starts again on the public page
    expect(audio.music).toEqual(['menu-lobby'])
  })

  it('startet die Menümusik erst mit den geladenen Einstellungen', async () => {
    mockApi({
      'GET /settings': () => ({ json: testSettings((s) => (s.sound.muted = true)) }),
    })
    const { audio } = renderApp('/')
    await waitFor(() => expect(audio.music).toEqual(['menu-lobby']))
    // Before the first music call the buses are already muted, never the defaults
    const first = audio.calls.findIndex((c) => c.method === 'playMusic')
    const before = audio.calls.slice(0, first).filter((c) => c.method === 'setVolumes')
    expect(before.at(-1)?.args[0]).toMatchObject({ muted: true })
  })

  it('bleibt stumm, wenn eine Rechtsseite geöffnet wird', async () => {
    mockApi({
      'GET /settings': () => ({ json: testSettings((s) => (s.sound.muted = true)) }),
    })
    const { audio } = renderApp('/')
    await screen.findByText('Björn, an allen Fronten ist es ruhig.')
    await waitFor(() => expect(audio.volumes?.muted).toBe(true))
    await userEvent.click(screen.getByRole('button', { name: 'Benutzermenü für Björn' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Rechtliches' }))
    await screen.findByRole('heading', { name: 'Impressum' })
    // The music fades out, but the mute is not lifted while it does
    const stop = audio.calls.findIndex((c) => c.method === 'stopAll')
    expect(stop).toBeGreaterThan(-1)
    expect(audio.calls.slice(stop).some((c) => c.method === 'setVolumes')).toBe(false)
    expect(audio.volumes?.muted).toBe(true)
  })

  it('schaltet über die Kopfzeile stumm und speichert das', async () => {
    const { calls } = mockApi({
      'PUT /settings': (body) => ({ json: { ...testSettings(), settings: body } }),
    })
    const { audio } = renderApp('/')
    const button = await screen.findByRole('button', { name: 'Ton aus' })
    await waitFor(() => expect(button).toBeEnabled())
    await userEvent.click(button)
    expect(screen.getByRole('button', { name: 'Ton an' })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(audio.volumes?.muted).toBe(true))
    const put = calls.find((c) => c.method === 'PUT' && c.path === '/settings')
    expect((put?.body as { sound: { muted: boolean } }).sound.muted).toBe(true)
    // The mute button itself stays silent when switching off
    expect(audio.sfx).not.toContain('ui-click')
  })

  it('meldet Benachrichtigungen aus dem Lobby-Polling', () => {
    const before = lobbyData()
    const after = lobbyData({
      invitations: [...before.invitations, { ...before.invitations[0]!, id: 'inv-2' }],
      matches: before.matches.map((m) => (m.id === 'm-ost' ? { ...m, status: 'yourTurn' } : m)),
    })
    const diff = lobbyChanges(before, after)
    expect(diff.invitations).toEqual(['inv-2'])
    expect(lobbyChanges(before, before)).toEqual({
      invitations: [],
      yourTurn: [],
      deadlineSoon: [],
    })
  })

  it('spielt den Einladungston, wenn die Lobby eine neue Einladung liefert', async () => {
    let round = 0
    mockApi({
      'GET /lobby': () => {
        round++
        const data = lobbyData()
        return {
          json:
            round === 1
              ? data
              : {
                  ...data,
                  invitations: [...data.invitations, { ...data.invitations[0]!, id: 'inv-2' }],
                },
        }
      },
    })
    const { audio, queryClient } = renderApp('/')
    await screen.findByText(/Inselhüpfen/)
    expect(audio.sfx).not.toContain('notify-invite')
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: ['lobby'] })
    })
    await waitFor(() => expect(audio.sfx).toContain('notify-invite'))
  })
})
