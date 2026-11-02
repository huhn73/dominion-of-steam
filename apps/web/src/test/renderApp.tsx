import { render } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router'
import type { Me } from '@dos/shared/account'
import { ThemeProvider } from '../theme/ThemeProvider'
import { routeConfig } from '../router'
import { createQueryClient } from '../data/queryClient'
import { meKey } from '../data/session'
import { AudioProvider } from '../audio/AudioProvider'
import { FakeEngine } from '../audio/fakeEngine'
import { testUser } from './mockApi'

/**
 * Render the app at `path`. By default Björn is logged in (put into the cache, so no request
 * is needed); `user: null` starts logged out, `user: undefined` asks `GET /me`.
 */
export function renderApp(path = '/', options: { user?: Me | null; audio?: FakeEngine } = {}) {
  const user = 'user' in options ? options.user : testUser
  // Audio is recorded, never played (jsdom has no AudioContext)
  const audio = options.audio ?? new FakeEngine()
  const router = createMemoryRouter(routeConfig, { initialEntries: [path] })
  const queryClient = createQueryClient({ defaultOptions: { queries: { retry: false } } })
  if (user !== undefined) queryClient.setQueryData(meKey, user)
  const result = render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AudioProvider engine={audio}>
          <RouterProvider router={router} />
        </AudioProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  )
  return { router, queryClient, audio, ...result }
}
