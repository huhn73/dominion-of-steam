import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateMatchRequest, CreateMatchResponse, SetupData } from '@dos/shared/setup'
import { api } from './api'

export const setupKey = ['setup'] as const

/**
 * Data of the new-match wizard. Not refetched while the wizard is open (it keeps its own draft);
 * each visit loads a fresh draft and, after a match was created, a new invite link.
 */
export function useSetupData() {
  return useQuery({
    queryKey: setupKey,
    queryFn: () => api<SetupData>('/setup'),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useCreateMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateMatchRequest) =>
      api<CreateMatchResponse>('/matches', { method: 'POST', body }),
    onSuccess: () => queryClient.removeQueries({ queryKey: setupKey }),
  })
}
