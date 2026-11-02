import { useCallback, useEffect, useRef } from 'react'
import type { CombatResult } from '@dos/shared/game'
import type { PlayerView } from '@dos/shared/game/view'
import { useAudio } from '../audio/AudioProvider'
import { zoomLoudness } from '../audio/ambience'
import {
  cityThreatened,
  enemyVisible,
  type FieldMemory,
  INITIAL_FIELD,
  LAYER_OF,
  nextField,
} from '../audio/fieldMusic'
import {
  attackSfx,
  FACTION_IDS,
  FIELD_LAYERS,
  type MusicId,
  SFX_IDS,
  type SfxId,
  unitSfx,
} from '../audio/ids'
import type { BoardCue } from '../sections/spielfeld/types'

/** Error codes of refused commands that mean „that target does not work“ */
const MOVE_ERRORS = new Set([
  'UNREACHABLE',
  'INVALID_TARGET',
  'NO_MOVES',
  'NOT_BUILDABLE',
  'INVALID_ORDER',
])

const PATH_PREVIEW_MIN_MS = 150

/** Effects of the board (everything that is not an interface or notification sound) */
const BOARD_SFX: SfxId[] = SFX_IDS.filter(
  (id) => !id.startsWith('ui-') && !id.startsWith('notify-'),
)

const remember = (key: string) => {
  try {
    if (sessionStorage.getItem(key)) return false
    sessionStorage.setItem(key, '1')
  } catch {
    // no storage: play again after a reload
  }
  return true
}

const factionMusic = (factionId: string | undefined, kind: 'theme' | 'victory' | 'defeat') =>
  factionId && (FACTION_IDS as readonly string[]).includes(factionId)
    ? (`${factionId}-${kind}` as MusicId)
    : null

/**
 * Sound of a match: the three field layers follow the situation (audio brief), the faction
 * theme greets the player once when a match is first opened, victory or defeat end the music,
 * and the board's cues become effects and the ambience mix.
 */
export function useMatchAudio(view: PlayerView | undefined, lastCombat: CombatResult | null) {
  const { engine, sfx } = useAudio()
  const matchId = view?.match.id
  const you = view?.participants.find((p) => p.isYou)
  const factionId = you?.factionId
  const field = useRef<FieldMemory>(INITIAL_FIELD)
  const stinger = useRef<Promise<void> | null>(null)
  const endedRef = useRef(false)
  endedRef.current = !!view?.result
  const lastPreview = useRef(0)

  // Layers for the whole stay in the match; the board effects are loaded up front so the first
  // move or shot is not silent. The faction theme greets the player once per match.
  useEffect(() => {
    if (!matchId) return
    field.current = INITIAL_FIELD
    const theme = factionMusic(factionId, 'theme')
    engine.preload([...FIELD_LAYERS, ...BOARD_SFX, ...(theme ? [theme] : [])])
    engine.startLayers('field-explore')
    if (theme && !endedRef.current && remember(`dos-theme-played:${matchId}`))
      stinger.current = engine.playStinger(theme)
    return () => {
      // Leaving the match fades out layers, ambience and a running theme or result piece
      engine.stopLayers()
      engine.stopStinger()
      engine.stopAmbience()
    }
  }, [engine, matchId, factionId])

  // Situation → layer
  const round = view?.match.round ?? 0
  const phase = view?.match.phase
  const threat = view
    ? enemyVisible(view.units, view.match.youId) ||
      cityThreatened(view.cities, view.units, view.match.youId)
    : false
  const combat =
    !!lastCombat || (phase === 'replay' && !!view?.replay.some((a) => a.action !== 'move'))
  const ended = !!view?.result
  useEffect(() => {
    if (!matchId || ended) return
    const next = nextField(field.current, { round, threat, combat })
    const changed = next.state !== field.current.state
    field.current = next
    if (!changed) return
    engine.setLayer(LAYER_OF[next.state])
  }, [engine, matchId, round, threat, combat, ended])

  // Victory or defeat once; afterwards it stays quiet until the player leaves
  const won = !!view?.result && view.result.winnerId === view.match.youId
  useEffect(() => {
    if (!matchId || !ended) return
    const piece = factionMusic(factionId, won ? 'victory' : 'defeat')
    if (!piece || !remember(`dos-result-played:${matchId}`)) {
      engine.stopLayers()
      return
    }
    void engine.playStinger(piece, { resumeLayers: false })
  }, [engine, matchId, ended, won, factionId])

  const onCue = useCallback(
    (cue: BoardCue) => {
      switch (cue.type) {
        case 'unitSelected': {
          const id = unitSfx(cue.unitTypeId, 'select')
          if (id) sfx(id)
          return
        }
        case 'unitMoved': {
          const id = unitSfx(cue.unitTypeId, 'move')
          if (id) sfx(id)
          return
        }
        case 'moveInvalid':
          return sfx('move-invalid')
        case 'pathPreview': {
          const now = Date.now()
          if (now - lastPreview.current < PATH_PREVIEW_MIN_MS) return
          lastPreview.current = now
          return sfx('path-preview')
        }
        case 'attackStarted':
          return sfx(attackSfx(cue.attackerTypeId, cue.domain))
        case 'hit':
          return sfx('explosion-small')
        case 'unitDestroyed':
          return sfx('explosion-large')
        case 'cityCaptured':
          return sfx('city-captured')
        case 'turnEnded':
          return sfx('turn-end')
        case 'turnStarted':
          return sfx('turn-start')
        case 'replayStep':
          return sfx('replay-step')
        case 'event':
          if (cue.eventType === 'cityLost') return sfx('city-lost')
          if (cue.eventType === 'unitBuilt') return sfx('production-done')
          if (cue.eventType === 'fuelLow') return sfx('fuel-low')
          return
        case 'ambience': {
          const factor = zoomLoudness(cue.zoom)
          const mix = Object.fromEntries(Object.entries(cue.mix).map(([id, w]) => [id, w * factor]))
          return engine.setAmbience(mix)
        }
      }
    },
    [engine, sfx],
  )

  const onRejected = useCallback(
    (code: string) => sfx(MOVE_ERRORS.has(code) ? 'move-invalid' : 'ui-error'),
    [sfx],
  )

  return { onCue, onRejected }
}
