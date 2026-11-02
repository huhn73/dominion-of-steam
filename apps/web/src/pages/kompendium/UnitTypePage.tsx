import { useNavigate, useParams, useSearchParams } from 'react-router'
import { EinheitDetail } from '../../sections/fraktionen/components'
import { useCompendium } from '../../data/compendium'
import { routes } from '../../routes'
import { CompendiumError, CompendiumLoading, CompendiumNotFound } from './CompendiumState'
import { useBack } from './useBack'

export function UnitTypePage() {
  const { unitTypeId = '' } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const { data, error, isPending, refetch } = useCompendium()
  const variant = search.get('ausfuehrung')
  // Direkt aufgerufen mit Ausführung: „Zurück“ führt zu dieser Fraktion, sonst zum Kompendium
  const back = useBack(
    variant && data?.factions.some((f) => f.id === variant)
      ? routes.faction(variant)
      : routes.factions,
  )

  if (isPending) return <CompendiumLoading />
  if (error || !data) return <CompendiumError error={error} onRetry={() => void refetch()} />
  const unitType = data.unitTypes.find((u) => u.id === unitTypeId)
  if (!unitType) return <CompendiumNotFound what="Diesen Einheitentyp" />
  const faction = data.factions.find((f) => f.id === unitType.factionId) ?? null
  const initialVariant = variant && data.factions.some((f) => f.id === variant) ? variant : null

  return (
    <EinheitDetail
      // liest die Vorauswahl nur beim ersten Rendern, deshalb neu mounten
      key={`${unitType.id}-${initialVariant ?? ''}`}
      unitType={unitType}
      faction={faction}
      factions={data.factions}
      initialVariantFactionId={initialVariant}
      unitTypes={data.unitTypes}
      onSelectFaction={(id) => navigate(routes.faction(id))}
      onBack={back}
    />
  )
}
