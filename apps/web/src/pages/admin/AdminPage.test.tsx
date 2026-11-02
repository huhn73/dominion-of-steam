import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AdminRange, AdminStats } from '@dos/shared/admin'
import { renderApp } from '../../test/renderApp'
import { mockApi, testUser } from '../../test/mockApi'

afterEach(() => vi.unstubAllGlobals())

const admin = { ...testUser, isAdmin: true }

function stats(range: AdminRange, total = 12): AdminStats {
  return {
    range,
    accounts: { total, verified: 9, new: 3, active24h: 2, activeRange: 5 },
    matches: {
      waiting: 1,
      running: 4,
      finished: 6,
      live: 2,
      async: 9,
      solo: 7,
      multiplayer: 4,
      avgRoundsFinished: 23.5,
      newInRange: 3,
    },
    daily: Array.from({ length: range }, (_, i) => ({
      date: new Date(Date.UTC(2026, 10, 2) - (range - 1 - i) * 86_400_000)
        .toISOString()
        .slice(0, 10),
      registrations: i % 2,
      matchesStarted: i % 3,
      turns: i,
    })),
    recentPlayers: [
      {
        id: 'x1',
        name: 'Kapitänin Ada',
        avatarUrl: null,
        createdAt: '2026-10-20T10:00:00Z',
        lastSeenAt: '2026-11-02T09:00:00Z',
        emailVerified: true,
        matches: 3,
      },
    ],
    recentMatches: [
      {
        id: 'm1',
        name: 'Gefecht am Kesselfjord',
        mode: 'async',
        status: 'running',
        round: 14,
        humans: 2,
        ais: 1,
        createdAt: '2026-10-28T10:00:00Z',
        updatedAt: '2026-11-02T08:00:00Z',
      },
    ],
  }
}

describe('Verwaltung: Nutzungsübersicht', () => {
  it('zeigt Kennzahlen, Verlauf und Listen; der Zeitraum lädt neu', async () => {
    const { calls } = mockApi({
      'GET /me': () => ({ json: admin }),
      'GET /admin/stats?range=30': () => ({ json: stats(30) }),
      'GET /admin/stats?range=7': () => ({ json: stats(7, 13) }),
    })
    renderApp('/admin', { user: admin })

    const kontoKacheln = await screen.findByLabelText('Konten', { selector: 'dl' })
    expect(within(kontoKacheln).getByText('12')).toBeInTheDocument()
    expect(within(kontoKacheln).getByText('75 %')).toBeInTheDocument()
    expect(screen.getByText('Ø 23,5 Runden')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Anmeldungen pro Tag/ })).toBeInTheDocument()
    expect(screen.getByText('Kapitänin Ada')).toBeInTheDocument()
    expect(screen.getByText('Gefecht am Kesselfjord')).toBeInTheDocument()
    expect(screen.queryByText(/@/)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('radio', { name: '7 Tage' }))
    await waitFor(() =>
      expect(
        within(screen.getByLabelText('Konten', { selector: 'dl' })).getByText('13'),
      ).toBeInTheDocument(),
    )
    expect(calls.map((c) => c.path)).toContain('/admin/stats?range=7')
  })

  it('Nicht-Admins sehen weder Menüeintrag noch Seite', async () => {
    const { calls } = mockApi({})
    renderApp('/admin')
    expect(
      await screen.findByText('Diese Seite gibt es nicht.', { exact: false }),
    ).toBeInTheDocument()
    expect(calls.some((c) => c.path.startsWith('/admin'))).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: /Benutzermenü/ }))
    expect(screen.queryByRole('menuitem', { name: 'Verwaltung' })).not.toBeInTheDocument()
  })

  it('Admins öffnen die Übersicht über das Benutzermenü', async () => {
    mockApi({
      'GET /me': () => ({ json: admin }),
      'GET /admin/stats?range=30': () => ({ json: stats(30) }),
    })
    const { router } = renderApp('/', { user: admin })
    await userEvent.click(await screen.findByRole('button', { name: /Benutzermenü/ }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Verwaltung' }))
    expect(router.state.location.pathname).toBe('/admin')
    expect(await screen.findByRole('heading', { name: 'Nutzung' })).toBeInTheDocument()
  })

  it('403 vom Server: Seite gibt es nicht', async () => {
    mockApi({
      'GET /me': () => ({ json: admin }),
      'GET /admin/stats?range=30': () => ({
        status: 403,
        json: { error: { code: 'FORBIDDEN', message: 'Kein Zugriff.' } },
      }),
    })
    renderApp('/admin', { user: admin })
    expect(
      await screen.findByText('Diese Seite gibt es nicht.', { exact: false }),
    ).toBeInTheDocument()
  })
})
