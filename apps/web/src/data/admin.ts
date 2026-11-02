import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { AdminRange, AdminStats } from '@dos/shared/admin'
import { api, ApiRequestError } from './api'

export const adminStatsKey = (range: AdminRange) => ['admin', 'stats', range] as const

/** Usage overview (admins only); keeps the previous range visible while the next one loads */
export function useAdminStats(range: AdminRange, enabled = true) {
  return useQuery({
    queryKey: adminStatsKey(range),
    queryFn: () => api<AdminStats>(`/admin/stats?range=${range}`),
    enabled,
    placeholderData: keepPreviousData,
    retry: (count, error) =>
      !(error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) &&
      count < 3,
  })
}
