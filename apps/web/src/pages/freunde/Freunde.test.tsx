import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { FriendsData } from '@dos/shared/account'
import { renderApp } from '../../test/renderApp'
import { mockApi } from '../../test/mockApi'

const lena = { id: 'p2', name: 'Lena Hartmann', avatarUrl: null }
const data = (patch: Partial<FriendsData> = {}): FriendsData => ({
  friends: [{ ...lena, status: 'online', lastSeen: null }],
  incoming: [{ id: 'p5', name: 'Kalle Rauch', avatarUrl: null, createdAt: '2026-11-07T10:00:00Z' }],
  outgoing: [
    { id: 'p6', name: 'Mira Okonkwo', avatarUrl: null, createdAt: '2026-11-07T09:00:00Z' },
  ],
  ...patch,
})

describe('Freunde', () => {
  it('zeigt Anfragen und Freunde, zählt Anfragen in der Navigation und nimmt an', async () => {
    const { calls } = mockApi({
      'GET /friends': () => ({ json: data() }),
      'POST /friends/requests/p5/accept': () => ({
        json: data({
          friends: [
            { ...lena, status: 'online', lastSeen: null },
            { id: 'p5', name: 'Kalle Rauch', avatarUrl: null, status: 'offline', lastSeen: null },
          ],
          incoming: [],
        }),
      }),
    })
    renderApp('/freunde')
    const incoming = await screen.findByRole('region', { name: 'Anfragen an dich' })
    expect(within(incoming).getByText('Kalle Rauch')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Gesendete Anfragen' })).toHaveTextContent(
      'Mira Okonkwo',
    )
    expect(screen.getAllByRole('button', { name: /Freunde/ })[0]).toHaveTextContent('Freunde1')

    await userEvent.click(within(incoming).getByRole('button', { name: /Annehmen/ }))
    expect(await screen.findByRole('status')).toHaveTextContent('Ihr seid jetzt befreundet')
    expect(screen.queryByRole('region', { name: 'Anfragen an dich' })).toBeNull()
    expect(calls.map((c) => c.path)).toContain('/friends/requests/p5/accept')
  })

  it('schickt eine Anfrage per Name und entfernt einen Freund nach Rückfrage', async () => {
    const { calls } = mockApi({
      'GET /friends': () => ({ json: data({ incoming: [], outgoing: [] }) }),
      'POST /friends/requests': () => ({ status: 201, json: data({ incoming: [], outgoing: [] }) }),
      'DELETE /friends/p2': () => ({ json: data({ friends: [], incoming: [], outgoing: [] }) }),
    })
    renderApp('/freunde')
    await userEvent.type(
      await screen.findByPlaceholderText('Anzeigename eines Spielers'),
      'Jonas Vogt',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Anfrage senden' }))
    await waitFor(() =>
      expect(calls.find((c) => c.path === '/friends/requests')?.body).toEqual({
        name: 'Jonas Vogt',
      }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Lena Hartmann als Freund entfernen' }),
    )
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Entfernen' }),
    )
    expect(await screen.findByText('Noch keine Freunde')).toBeInTheDocument()
  })

  it('öffnet das Profil eines Freundes', async () => {
    mockApi({
      'GET /friends': () => ({ json: data() }),
      'GET /players/p2/profile': () => ({
        status: 404,
        json: { error: { code: 'PLAYER_NOT_FOUND', message: 'Konto nicht gefunden.' } },
      }),
    })
    const { router } = renderApp('/freunde')
    await userEvent.click(
      await screen.findByRole('button', { name: 'Profil von Lena Hartmann öffnen' }),
    )
    expect(router.state.location.pathname).toBe('/spieler/p2')
  })
})
