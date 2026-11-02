import { MAX_MAP_SIDE } from '@dos/shared/game'
import type { Command, HexCoord } from '@dos/shared/game'

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const isString = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0 && v.length < 100
const isCoord = (v: unknown): v is HexCoord =>
  isObject(v) &&
  Number.isInteger(v.col) &&
  Number.isInteger(v.row) &&
  (v.col as number) >= 0 &&
  (v.row as number) >= 0 &&
  (v.col as number) < MAX_MAP_SIDE &&
  (v.row as number) < MAX_MAP_SIDE

/** Check the shape of a command from the client; game rules are checked by the engine */
export function parseCommand(body: unknown): Command | null {
  if (!isObject(body) || typeof body.type !== 'string') return null
  const { type } = body
  switch (type) {
    case 'move':
    case 'goto':
    case 'unload':
      return isString(body.unitId) && isCoord(body.target)
        ? { type, unitId: body.unitId, target: body.target }
        : null
    case 'sentry':
    case 'explore':
    case 'cancelOrder':
    case 'skip':
      return isString(body.unitId) ? { type, unitId: body.unitId } : null
    case 'patrol':
      return isString(body.unitId) &&
        Array.isArray(body.waypoints) &&
        body.waypoints.length <= 20 &&
        body.waypoints.every(isCoord)
        ? { type, unitId: body.unitId, waypoints: body.waypoints }
        : null
    case 'attack': {
      const t = body.target
      if (!isString(body.unitId) || !isObject(t)) return null
      if (isString(t.unitId)) return { type, unitId: body.unitId, target: { unitId: t.unitId } }
      if (isString(t.cityId)) return { type, unitId: body.unitId, target: { cityId: t.cityId } }
      return null
    }
    case 'setProduction':
      return isString(body.cityId) && isString(body.unitTypeId)
        ? { type, cityId: body.cityId, unitTypeId: body.unitTypeId }
        : null
    case 'markEventRead':
      return isString(body.eventId) ? { type, eventId: body.eventId } : null
    case 'skipReplay':
    case 'endTurn':
      return { type }
    default:
      return null
  }
}
