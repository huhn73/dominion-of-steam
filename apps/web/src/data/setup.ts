import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateMatchRequest, CreateMatchResponse, SetupData } from '@dos/shared/setup'
import { api } from './api'
import { useLocalizedMasterData } from '../i18n/localize'

export const setupKey = ['setup'] as const

/**
 * Data of the new-match wizard. Not refetched while the wizard is open (it keeps its own draft);
 * each visit loads a fresh draft and, after a match was created, a new invite link.
 */
export function useSetupData() {
  const select = useLocalizedMasterData<SetupData>()
  return useQuery({
    queryKey: setupKey,
    queryFn: () => api<SetupData>('/setup'),
    select,
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
