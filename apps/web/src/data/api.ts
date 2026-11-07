import type { ApiError } from '@dos/shared/game'
import { translate } from '@dos/shared/i18n'
import { activeLocale } from '../i18n/locale'

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

/** JSON request to the API; a `FormData` body is sent as multipart (file uploads) */
export async function api<T>(
  path: string,
  init?: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown },
): Promise<T> {
  let res: Response
  const form = init?.body instanceof FormData
  try {
    res = await fetch(`/api${path}`, {
      method: init?.method ?? 'GET',
      headers: {
        'X-Locale': activeLocale(),
        ...(init?.body !== undefined && !form ? { 'Content-Type': 'application/json' } : {}),
      },
      body: form
        ? (init.body as FormData)
        : init?.body !== undefined
          ? JSON.stringify(init.body)
          : undefined,
    })
  } catch {
    throw new ApiRequestError(0, 'NETWORK', translate(activeLocale(), 'common.api.network'))
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as ApiError | null
    throw new ApiRequestError(
      res.status,
      data?.error.code ?? 'UNKNOWN',
      data?.error.message ?? translate(activeLocale(), 'common.api.unknown'),
    )
  }
  return (await res.json()) as T
}
