import type {
  GameEvent,
  GameEventType,
  HexCoord,
  Participant,
  ReplayAction,
  UnitType,
} from '../types'

import { translator, type Translate } from '@dos/shared/i18n'

// Turn report: the events and seen opponent actions since the last own turn, grouped for the
// report card at the start of a turn. Pure, so it can be tested without the map.

export type ReportSectionId = 'losses' | 'cities' | 'combat' | 'sightings' | 'enemyMoves' | 'home'
export type ReportIcon = GameEventType | ReplayAction['action']

export interface ReportEntry {
  key: string
  icon: ReportIcon
  text: string
  detail?: string
  coord: HexCoord
  /** Set for entries that come from an event; the click marks it read */
  eventId?: string
  isNew: boolean
}

export interface ReportSection {
  id: ReportSectionId
  title: string
  entries: ReportEntry[]
}

export interface TurnReport {
  round: number
  sections: ReportSection[]
  isEmpty: boolean
}

const SECTION_OF: Record<GameEventType, ReportSectionId> = {
  unitLost: 'losses',
  cityLost: 'cities',
  cityCaptured: 'cities',
  combat: 'combat',
  enemySighted: 'sightings',
  cityDiscovered: 'sightings',
  unitBuilt: 'home',
  fuelLow: 'home',
  exploration: 'home',
  dominance: 'cities',
  capitulation: 'cities',
}

const ORDER: ReportSectionId[] = ['losses', 'cities', 'combat', 'sightings', 'enemyMoves', 'home']

export function buildTurnReport({
  events,
  replay,
  participants,
  unitTypes,
  round,
  t = translator('de'),
}: {
  /** Language of the texts; German by default */
  t?: Translate
  events: GameEvent[]
  replay: ReplayAction[]
  participants: Participant[]
  unitTypes: UnitType[]
  round: number
}): TurnReport {
  const entries = new Map<ReportSectionId, ReportEntry[]>()
  const push = (id: ReportSectionId, entry: ReportEntry) =>
    entries.set(id, [...(entries.get(id) ?? []), entry])

  for (const e of events)
    push(SECTION_OF[e.type], {
      key: e.id,
      icon: e.type,
      text: e.message,
      coord: { col: e.col, row: e.row },
      eventId: e.id,
      isNew: e.isNew,
    })

  const names = new Map(participants.map((p) => [p.id, p.name]))
  const types = new Map(unitTypes.map((t) => [t.id, t.name]))
  for (const r of replay) {
    const end = r.path[r.path.length - 1]
    if (!end) continue
    const verb =
      r.action === 'move'
        ? t('board.moveTo', { col: end.col, row: end.row })
        : t(`board.replay.${r.action}`)
    push('enemyMoves', {
      key: r.id,
      icon: r.action,
      text: `${types.get(r.unitTypeId) ?? r.unitTypeId} · ${names.get(r.participantId) ?? r.participantId}`,
      detail: r.result ? `${verb} · ${r.result}` : verb,
      coord: { col: end.col, row: end.row },
      isNew: true,
    })
  }

  const sections = ORDER.filter((id) => entries.has(id)).map((id) => ({
    id,
    title: t(`board.section.${id}`),
    entries: entries.get(id)!,
  }))
  return { round, sections, isEmpty: sections.length === 0 }
}
