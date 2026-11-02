import { useNavigate, useParams } from 'react-router'
import { FraktionDetail } from '../../sections/fraktionen/components'
import { useCompendium } from '../../data/compendium'
import { routes } from '../../routes'
import { CompendiumError, CompendiumLoading, CompendiumNotFound } from './CompendiumState'
import { useBack } from './useBack'

export function FactionPage() {
  const { factionId = '' } = useParams()
  const navigate = useNavigate()
  const back = useBack(routes.factions)
  const { data, error, isPending, refetch } = useCompendium()
  if (isPending) return <CompendiumLoading />
  if (error || !data) return <CompendiumError error={error} onRetry={() => void refetch()} />
  const faction = data.factions.find((f) => f.id === factionId)
  if (!faction) return <CompendiumNotFound what="Diese Fraktion" />
  return (
    <FraktionDetail
      key={faction.id}
      faction={faction}
      unitTypes={data.unitTypes}
      onSelectUnitType={(unitTypeId, fromFactionId) =>
        navigate(routes.unitType(unitTypeId, fromFactionId))
      }
      onBack={back}
    />
  )
}
