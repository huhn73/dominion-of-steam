import { useQuery } from '@tanstack/react-query'
import type { CompendiumData } from '@dos/shared/compendium'
import { api } from './api'

/** Factions and unit types are master data: loaded once and kept for the session */
export function useCompendium() {
  return useQuery({
    queryKey: ['compendium'],
    queryFn: () => api<CompendiumData>('/compendium'),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
