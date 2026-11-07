import { useQuery } from '@tanstack/react-query'
import type { CompendiumData } from '@dos/shared/compendium'
import { api } from './api'
import { useLocalizedMasterData } from '../i18n/localize'

/** Factions and unit types are master data: loaded once and kept for the session */
export function useCompendium() {
  const select = useLocalizedMasterData<CompendiumData>()
  return useQuery({
    queryKey: ['compendium'],
    queryFn: () => api<CompendiumData>('/compendium'),
    select,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
