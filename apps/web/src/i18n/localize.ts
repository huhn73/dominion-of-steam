import { useCallback } from 'react'
import { localizeFactions, localizeUnitTypes } from '@dos/shared/compendium'
import { useLocale } from './LocaleProvider'

/**
 * `select` for queries whose data carry factions and/or unit types: the server sends the
 * German master data, the client swaps in the texts of the chosen language by id.
 */
export function useLocalizedMasterData<
  T extends { factions?: readonly { id: string }[]; unitTypes?: readonly { id: string }[] },
>() {
  const { locale } = useLocale()
  return useCallback(
    (data: T): T => {
      if (locale === 'de') return data
      return {
        ...data,
        ...(data.factions ? { factions: localizeFactions(data.factions, locale) } : {}),
        ...(data.unitTypes ? { unitTypes: localizeUnitTypes(data.unitTypes, locale) } : {}),
      }
    },
    [locale],
  )
}
