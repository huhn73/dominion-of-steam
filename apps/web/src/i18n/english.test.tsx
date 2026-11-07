import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'
import { mockApi, testUser } from '../test/mockApi'

const en = { ...testUser, locale: 'en' as const }

describe('English', () => {
  it('shows the login page in English', async () => {
    mockApi({})
    renderApp('/anmelden', { user: null, locale: 'en' })
    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail address')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Imprint' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
  })

  it('shows the lobby and the settings in English', async () => {
    mockApi({})
    renderApp('/', { user: en, locale: 'en' })
    expect(await screen.findByRole('heading', { name: 'Situation report' })).toBeInTheDocument()
    expect(await screen.findByText('Björn, all quiet on every front.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /New match/ }).length).toBeGreaterThan(0)
    await userEvent.click(screen.getByRole('button', { name: 'User menu for Björn' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Settings' }))
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^Display/ }))
    expect(screen.getByRole('switch', { name: 'Reduce animations' })).toBeInTheDocument()
  })
})
