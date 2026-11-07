import type { CatalogOverride } from './catalogOverride'
import type {
  CatalogSweepConfig,
  MatchupConfig,
  ProfileKey,
  ProfileOverride,
  ProfileSweepConfig,
} from './config'

/** Cartesian product of the grid, keys in the order of the config */
export function gridCombinations(grid: ProfileSweepConfig['grid']): ProfileOverride[] {
  const entries = Object.entries(grid) as [ProfileKey, (number | boolean | string)[]][]
  let combos: Record<string, unknown>[] = [{}]
  for (const [key, values] of entries) {
    combos = combos.flatMap((c) => values.map((v) => ({ ...c, [key]: v })))
  }
  return combos as ProfileOverride[]
}

export const BASELINE_ID = 'sweep-0'

/**
 * One matchup per grid point: the subject with the overrides against the reference. `sweep-0` is
 * the baseline, the subject as configured without any override.
 */
export function sweepMatchups(sweep: ProfileSweepConfig): MatchupConfig[] {
  const base: MatchupConfig = {
    id: BASELINE_ID,
    participants: [sweep.subject, sweep.reference],
    sweepParams: {},
  }
  const points = gridCombinations(sweep.grid).map((params, i) => ({
    id: `sweep-${i + 1}`,
    participants: [
      { ...sweep.subject, profile: { ...sweep.subject.profile, ...params } },
      sweep.reference,
    ],
    sweepParams: params,
  }))
  return [base, ...points]
}

export const describeParams = (params: ProfileOverride) =>
  Object.entries(params)
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(', ') || 'Basis'

/** Cartesian product of a catalog grid */
export function catalogCombinations(grid: CatalogSweepConfig['catalogGrid']): CatalogOverride[] {
  let combos: CatalogOverride[] = [{}]
  for (const [key, values] of Object.entries(grid))
    combos = combos.flatMap((c) => values.map((v) => ({ ...c, [key]: v })))
  return combos
}

/**
 * Every grid point plays all matchups of the config with its catalog values; `sweep-0` is the
 * baseline with the config's own values. Matchup ids become `<point>-<matchup>`.
 */
export function catalogSweepMatchups(
  sweep: CatalogSweepConfig,
  matchups: readonly MatchupConfig[],
): MatchupConfig[] {
  const points = [{}, ...catalogCombinations(sweep.catalogGrid)]
  return points.flatMap((params, i) =>
    matchups.map((m) => ({
      ...m,
      id: `sweep-${i}-${m.id}`,
      catalog: { ...m.catalog, ...params },
      sweepPoint: `sweep-${i}`,
      catalogParams: params,
    })),
  )
}
