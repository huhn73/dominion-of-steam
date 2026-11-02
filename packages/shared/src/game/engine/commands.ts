import { withBonus } from '../bonus'
import { UNIT_TYPES } from '../catalog'
import {
  attackTargets,
  findPath,
  hexDistance,
  hexKey,
  isWater,
  reachableTiles,
  sameHex,
} from '../hex'
import type { CombatResult, HexCoord, UnitOrder } from '../types'
import type { Command } from '../view'
import { resolveCombat } from './combat'
import { exploreTurn } from './explore'
import {
  boardIfPossible,
  detach,
  budget,
  knowledge,
  logAction,
  refreshNeedsOrders,
  snapshotVisibility,
  walk,
} from './movement'
import { clone, currentParticipant, factionOf, type GameState, unitType } from './state'
import { endTurn } from './turn'
import { checkVictory } from './victory'
import { isCoastal, updateKnowledge } from './visibility'

export type CommandErrorCode =
  | 'NOT_YOUR_TURN'
  | 'REPLAY_ACTIVE'
  | 'MATCH_FINISHED'
  | 'NOT_FOUND'
  | 'NOT_YOURS'
  | 'NO_MOVES'
  | 'UNREACHABLE'
  | 'INVALID_TARGET'
  | 'INVALID_ORDER'
  | 'NOT_BUILDABLE'

export class CommandError extends Error {
  constructor(
    readonly code: CommandErrorCode,
    message: string,
  ) {
    super(message)
  }
}

export interface CommandOutcome {
  state: GameState
  combat?: CombatResult
}

const fail = (code: CommandErrorCode, message: string): never => {
  throw new CommandError(code, message)
}

/** Validate and apply a command of a participant. Throws `CommandError` on rule violations. */
export function applyCommand(
  input: GameState,
  playerId: string,
  cmd: Command,
  now = new Date(),
): CommandOutcome {
  const state = clone(input)
  if (cmd.type === 'markEventRead') {
    const event = state.events.find((e) => e.id === cmd.eventId && e.participantId === playerId)
    if (!event) fail('NOT_FOUND', 'Ereignis nicht gefunden.')
    event!.isNew = false
    return { state }
  }

  if (state.status !== 'running') fail('MATCH_FINISHED', 'Die Partie ist beendet.')
  if (currentParticipant(state).id !== playerId) fail('NOT_YOUR_TURN', 'Du bist nicht am Zug.')

  if (cmd.type === 'skipReplay') {
    state.phase = 'yourTurn'
    return { state }
  }
  if (state.phase === 'replay') fail('REPLAY_ACTIVE', 'Die Wiederholung der Gegnerzüge läuft noch.')

  switch (cmd.type) {
    case 'endTurn':
      return { state: endTurn(state, now) }
    case 'setProduction':
      setProduction(state, playerId, cmd.cityId, cmd.unitTypeId)
      return { state }
    case 'move':
      move(state, playerId, cmd.unitId, cmd.target, 'move')
      break
    case 'goto':
      move(state, playerId, cmd.unitId, cmd.target, 'goto')
      break
    case 'unload':
      unload(state, playerId, cmd.unitId, cmd.target)
      break
    case 'attack': {
      const combat = attack(state, playerId, cmd.unitId, cmd.target)
      updateKnowledge(state)
      // Taking the last enemy capital decides the match at once
      if (combat.captured) checkVictory(state, now)
      return { state, combat }
    }
    case 'sentry': {
      const unit = ownUnit(state, playerId, cmd.unitId)
      unit.order = { type: 'sentry' }
      unit.needsOrders = false
      break
    }
    case 'patrol': {
      const unit = ownUnit(state, playerId, cmd.unitId)
      const [first, ...rest] = cmd.waypoints
      if (!first || !rest.length || !sameHex(first, unit))
        fail('INVALID_ORDER', 'Eine Patrouille braucht mindestens einen Wegpunkt.')
      const { idx } = knowledge(state, playerId)
      if (rest.some((w) => !idx.tileAt(w) || idx.tileAt(w)!.visibility === 'unexplored'))
        fail('INVALID_ORDER', 'Wegpunkte müssen auf erforschten Feldern liegen.')
      unit.order = { type: 'patrol', waypoints: cmd.waypoints }
      unit.patrolIndex = 1
      unit.needsOrders = false
      break
    }
    case 'explore': {
      const unit = ownUnit(state, playerId, cmd.unitId)
      if (unitType(unit.unitTypeId).domain !== 'air')
        fail('INVALID_ORDER', 'Nur Flugzeuge können erkunden.')
      unit.order = { type: 'explore' }
      delete unit.patrolIndex
      unit.needsOrders = false
      exploreTurn(state, unit)
      refreshNeedsOrders(unit)
      if ((unit.order as UnitOrder).type !== 'none') unit.needsOrders = false
      break
    }
    case 'cancelOrder': {
      const unit = ownUnit(state, playerId, cmd.unitId)
      unit.order = { type: 'none' }
      delete unit.patrolIndex
      unit.skipped = false
      refreshNeedsOrders(unit)
      break
    }
    case 'skip': {
      const unit = ownUnit(state, playerId, cmd.unitId)
      unit.skipped = true
      unit.needsOrders = false
      break
    }
  }
  updateKnowledge(state)
  return { state }
}

// =============================================================================
// Helpers
// =============================================================================

function ownUnit(state: GameState, playerId: string, unitId: string) {
  const unit = state.units.find((u) => u.id === unitId)
  if (!unit) return fail('NOT_FOUND', 'Einheit nicht gefunden.')
  if (unit.ownerId !== playerId) fail('NOT_YOURS', 'Das ist nicht deine Einheit.')
  return unit
}

// =============================================================================
// Commands
// =============================================================================

function move(
  state: GameState,
  playerId: string,
  unitId: string,
  target: HexCoord,
  kind: 'move' | 'goto',
) {
  const unit = ownUnit(state, playerId, unitId)
  const { view, idx } = knowledge(state, playerId)
  const viewUnit = view.units.find((u) => u.id === unitId)!
  const type = unitType(unit.unitTypeId)

  if (kind === 'move') {
    if (budget(unit) <= 0) fail('NO_MOVES', 'Die Einheit hat in dieser Runde keine Bewegung mehr.')
    if (!reachableTiles(viewUnit, idx).has(hexKey(target)))
      fail('UNREACHABLE', 'Das Ziel ist in dieser Runde nicht erreichbar.')
  }
  const path = findPath(viewUnit, target, idx)
  if (!path) return fail('UNREACHABLE', 'Das Ziel ist nicht erreichbar.')

  const before = snapshotVisibility(state)
  const start = { col: unit.col, row: unit.row }
  const { walked, blocked } = walk(state, unit, path)
  unit.order = { type: 'none' }
  delete unit.patrolIndex
  if (sameHex(unit, target)) boardIfPossible(state, unit, idx)

  const remaining = path.length - walked.length
  if (kind === 'goto' && remaining > 0 && !blocked) {
    const movement = withBonus(type, factionOf(state, playerId), 'movement') ?? type.movement
    unit.order = { type: 'goto', target, turnsRemaining: Math.ceil(remaining / movement) }
  }
  refreshNeedsOrders(unit)
  if (unit.order.type !== 'none') unit.needsOrders = false
  logAction(state, unit, 'move', [start, ...walked], null, before)
}

function unload(state: GameState, playerId: string, unitId: string, target: HexCoord) {
  const unit = ownUnit(state, playerId, unitId)
  if (!unit.carriedBy) fail('INVALID_ORDER', 'Die Einheit ist nicht geladen.')
  if (unit.movesLeft <= 0) fail('NO_MOVES', 'Die Einheit hat in dieser Runde keine Bewegung mehr.')
  if (unitType(unit.unitTypeId).domain !== 'land')
    fail('INVALID_ORDER', 'Nur Landeinheiten werden ausgeladen.')
  const { idx } = knowledge(state, playerId)
  const tile = idx.tileAt(target)
  const city = idx.cityAt(target)
  const ok =
    hexDistance(unit, target) === 1 &&
    !!tile &&
    tile.visibility !== 'unexplored' &&
    !isWater(tile.terrain) &&
    !idx.unitsAt(target).some((u) => u.ownerId !== playerId) &&
    (!city || city.ownerId === playerId)
  if (!ok) fail('INVALID_TARGET', 'Hier kann nicht ausgeladen werden.')
  const before = snapshotVisibility(state)
  const start = { col: unit.col, row: unit.row }
  const { walked } = walk(state, unit, [target])
  if (!walked.length) return
  unit.movesLeft = 0
  refreshNeedsOrders(unit)
  logAction(state, unit, 'move', [start, target], null, before)
}

function attack(
  state: GameState,
  playerId: string,
  unitId: string,
  target: { unitId?: string; cityId?: string },
): CombatResult {
  const unit = ownUnit(state, playerId, unitId)
  const { view, idx } = knowledge(state, playerId)
  const viewUnit = view.units.find((u) => u.id === unitId)!
  const options = attackTargets(viewUnit, idx, view.units, view.cities, [])
  const chosen = options.find((t) =>
    target.unitId ? t.unitId === target.unitId : !!target.cityId && t.cityId === target.cityId,
  )
  if (!chosen) return fail('INVALID_TARGET', 'Dieses Ziel kann nicht angegriffen werden.')

  const before = snapshotVisibility(state)
  const start = { col: unit.col, row: unit.row }
  let walked: HexCoord[] = []
  if (hexDistance(unit, chosen.coord) > 1) {
    // Move next to the target first, using the closest tile from which the attack is possible
    const reach = reachableTiles(viewUnit, idx)
    const origin = [...reach.values()]
      .filter((r) => r.dist < unit.movesLeft && hexDistance(r.coord, chosen.coord) === 1)
      .sort((a, b) => a.dist - b.dist)[0]
    const path = origin && findPath(viewUnit, origin.coord, idx)
    if (!path) return fail('UNREACHABLE', 'Das Ziel ist nicht erreichbar.')
    walked = walk(state, unit, path).walked
    if (walked.length < path.length) {
      unit.movesLeft = 0
      refreshNeedsOrders(unit)
      logAction(state, unit, 'move', [start, ...walked], null, before)
      return fail('UNREACHABLE', 'Der Weg zum Ziel ist versperrt.')
    }
  }
  detach(state, unit)
  const combat = resolveCombat(state, unit, target)
  const survivor = state.units.find((u) => u.id === unitId)
  // The attack cost one move; with moves left the unit may act again
  if (survivor) refreshNeedsOrders(survivor)
  const action = combat.captured ? 'capture' : 'attack'
  logAction(
    state,
    survivor ?? unit,
    action,
    [start, ...walked, { col: chosen.coord.col, row: chosen.coord.row }],
    combat.message,
    before,
  )
  return combat
}

function setProduction(state: GameState, playerId: string, cityId: string, unitTypeId: string) {
  const city = state.cities.find((c) => c.id === cityId)
  if (!city) return fail('NOT_FOUND', 'Stadt nicht gefunden.')
  if (city.ownerId !== playerId) fail('NOT_YOURS', 'Das ist nicht deine Stadt.')
  const type = UNIT_TYPES.find((t) => t.id === unitTypeId)
  const faction = factionOf(state, playerId)
  if (!type || (type.factionId && type.factionId !== faction?.id))
    return fail('NOT_BUILDABLE', 'Dieser Einheitentyp kann hier nicht gebaut werden.')
  if (type.domain === 'sea' && !isCoastal(state, city))
    fail('NOT_BUILDABLE', 'Seeeinheiten können nur in Küstenstädten gebaut werden.')
  if (city.production?.unitTypeId === unitTypeId) return
  city.production = {
    unitTypeId,
    progress: 0,
    turnsRemaining:
      (withBonus(type, faction, 'productionTurns') ?? type.productionTurns) + city.damage,
  }
}
