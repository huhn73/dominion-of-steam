import { useState } from 'react'
import { DEFAULT_ADMIN_RANGE, type AdminRange } from '@dos/shared/admin'
import { useAdminStats } from '../../data/admin'
import { ApiRequestError } from '../../data/api'
import { useMe } from '../../data/session'
import { Nutzungsuebersicht } from '../../sections/admin/components'
import { NotFoundPage } from '../pages'
import { PageState } from '../profil/PageState'

/** Nutzungsübersicht aus GET /api/admin/stats; für Nicht-Admins gibt es die Seite nicht */
export function AdminPage() {
  const me = useMe().data
  const isAdmin = me?.isAdmin === true
  const [range, setRange] = useState<AdminRange>(DEFAULT_ADMIN_RANGE)
  const { data, error, isPending, isFetching, refetch } = useAdminStats(range, isAdmin)

  if (!isAdmin || (error instanceof ApiRequestError && error.status === 403))
    return <NotFoundPage />
  if (isPending)
    return (
      <PageState
        title="Verwaltung"
        loadingText="Lade Nutzungszahlen …"
        fallback=""
        onRetry={() => undefined}
      />
    )
  if (!data)
    return (
      <PageState
        title="Verwaltung"
        loadingText=""
        error={error}
        fallback="Die Nutzungszahlen konnten nicht geladen werden."
        onRetry={() => void refetch()}
      />
    )
  return (
    <Nutzungsuebersicht stats={data} range={range} onRangeChange={setRange} loading={isFetching} />
  )
}
