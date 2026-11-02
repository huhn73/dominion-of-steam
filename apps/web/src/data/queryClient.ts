import {
  MutationCache,
  QueryCache,
  QueryClient,
  type QueryClientConfig,
} from '@tanstack/react-query'
import { ApiRequestError } from './api'
import { meKey } from './session'

/**
 * Query client of the app: any 401 from the API (e.g. expired session) marks the player as
 * logged out, and the auth guard then sends them to the login page.
 */
export function createQueryClient(config: QueryClientConfig = {}) {
  const onError = (error: unknown) => {
    if (error instanceof ApiRequestError && error.status === 401)
      queryClient.setQueryData(meKey, null)
  }
  const queryClient: QueryClient = new QueryClient({
    ...config,
    defaultOptions: {
      ...config.defaultOptions,
      queries: {
        retry: (count, error) =>
          !(error instanceof ApiRequestError && error.status === 401) && count < 3,
        ...config.defaultOptions?.queries,
      },
    },
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
  })
  return queryClient
}
