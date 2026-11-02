import { useNavigate } from 'react-router'
import { FraktionenUndEinheiten } from '../../sections/fraktionen/components'
import { useCompendium } from '../../data/compendium'
import { routes } from '../../routes'
import { CompendiumError, CompendiumLoading } from './CompendiumState'

export function CompendiumPage() {
  const navigate = useNavigate()
  const { data, error, isPending, refetch } = useCompendium()
  if (isPending) return <CompendiumLoading />
  if (error || !data) return <CompendiumError error={error} onRetry={() => void refetch()} />
  return (
    <FraktionenUndEinheiten
      factions={data.factions}
      unitTypes={data.unitTypes}
      onSelectFaction={(id) => navigate(routes.faction(id))}
      onSelectUnitType={(id) => navigate(routes.unitType(id))}
    />
  )
}
