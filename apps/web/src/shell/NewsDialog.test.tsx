import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../test/renderApp'
import { mockApi, testUser } from '../test/mockApi'
import { currentVersion } from '../data/news'

afterEach(() => vi.unstubAllGlobals())

// Tests run as „<package version>-dev“; the entries come from @dos/shared/news
const seenBefore = (version: string) => ({ ...testUser, newsSeenVersion: version })

describe('Neuigkeiten', () => {
  it('zeigt nach einem Update die ungesehenen Versionen und merkt sich „Verstanden“', async () => {
    const { calls } = mockApi({
      'POST /news/seen': (body) => ({
        json: { ...testUser, newsSeenVersion: (body as { version: string }).version },
      }),
    })
    renderApp('/', { user: seenBefore('0.9.0') })
    const dialog = await screen.findByRole('dialog', { name: 'Neu in Dominion of Steam' })
    expect(within(dialog).getByText('Version 0.10.0')).toBeInTheDocument()
    expect(within(dialog).queryByText('Version 0.9.0')).toBeNull()
    expect(within(dialog).getByText(/Tutorial „Erste Schritte“/)).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Verstanden' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(calls.find((c) => c.path === '/news/seen')?.body).toEqual({
      version: currentVersion(),
    })
  })

  it('zeigt keinen Hinweis ohne neues Update und keinen für Spieler ohne gesehene Version', async () => {
    mockApi({})
    renderApp('/', { user: seenBefore(currentVersion()) })
    expect(await screen.findByText('Lagezentrum')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('verlinkt die Übersicht in der Fußzeile, auch ohne Anmeldung', async () => {
    mockApi({})
    const { router } = renderApp('/impressum', { user: null })
    await userEvent.click(await screen.findByRole('link', { name: 'Neuigkeiten' }))
    expect(router.state.location.pathname).toBe('/neuigkeiten')
    expect(await screen.findByRole('heading', { name: 'Neuigkeiten' })).toBeInTheDocument()
    expect(screen.getByText('Version 0.9.0')).toBeInTheDocument()
    expect(screen.getByText(/Dominion of Steam ist da/)).toBeInTheDocument()
  })
})
