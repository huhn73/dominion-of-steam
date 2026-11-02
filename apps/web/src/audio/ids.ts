// IDs of the audio files in public/audio (see public/audio/manifest.json and the audio brief).
// `ids.test.ts` checks that these lists and the manifest agree.

export const FACTION_IDS = ['eisenbund', 'aurelia', 'nordmark', 'salzkueste'] as const
export type FactionAudioId = (typeof FACTION_IDS)[number]

export const FIELD_LAYERS = ['field-explore', 'field-tension', 'field-combat'] as const
export type FieldLayer = (typeof FIELD_LAYERS)[number]

export const MUSIC_IDS = [
  'menu-lobby',
  'menu-setup',
  ...FIELD_LAYERS,
  ...FACTION_IDS.flatMap((f) => [`${f}-theme`, `${f}-victory`, `${f}-defeat`] as const),
] as const
export type MusicId = (typeof MUSIC_IDS)[number]

export const AMBIENCE_IDS = [
  'amb-sea',
  'amb-coast',
  'amb-plains',
  'amb-forest',
  'amb-mountains',
  'amb-city',
  'amb-fog',
] as const
export type AmbienceId = (typeof AMBIENCE_IDS)[number]

/** Unit types with their own select/move sounds (faction variants share them) */
export const UNIT_SFX_TYPES = [
  'grenadiere',
  'panzerwagen',
  'dampfkoloss',
  'kanonenboot',
  'panzerkreuzer',
  'tauchboot',
  'frachter',
  'flugzeugtraeger',
  'blitzkorvette',
  'doppeldecker',
  'schwerbomber',
  'wolkenkreuzer',
] as const
export type UnitSfxType = (typeof UNIT_SFX_TYPES)[number]

export const SFX_IDS = [
  // Interface
  'ui-click',
  'ui-toggle',
  'ui-panel-open',
  'ui-panel-close',
  'ui-error',
  'ui-saved',
  'notify-your-turn',
  'notify-invite',
  'notify-deadline',
  // Board
  'turn-start',
  'turn-end',
  'replay-step',
  'move-invalid',
  'path-preview',
  'combat-gun',
  'combat-cannon',
  'combat-air',
  'explosion-small',
  'explosion-large',
  'city-captured',
  'city-lost',
  'production-done',
  'fuel-low',
  // Units
  ...UNIT_SFX_TYPES.flatMap((u) => [`${u}-select`, `${u}-move`] as const),
] as const
export type SfxId = (typeof SFX_IDS)[number]

export type AudioId = MusicId | AmbienceId | SfxId

/** Select/move sound of a unit type; unknown types (future content) get nothing */
export function unitSfx(unitTypeId: string, kind: 'select' | 'move'): SfxId | null {
  return (UNIT_SFX_TYPES as readonly string[]).includes(unitTypeId)
    ? (`${unitTypeId}-${kind}` as SfxId)
    : null
}

/** Attack sound by attacker: infantry fires guns, armour and ships cannons, aircraft bombs */
export function attackSfx(unitTypeId: string, domain: 'land' | 'sea' | 'air'): SfxId {
  if (domain === 'air') return 'combat-air'
  if (unitTypeId === 'grenadiere') return 'combat-gun'
  return 'combat-cannon'
}

export const MANIFEST_URL = '/audio/manifest.json'

/** Bars of the field layers (76.385 s at ≈88 BPM, 4/4); the bar length comes from the file length */
export const FIELD_BARS = 28

/** Shape of public/audio/manifest.json as far as the engine reads it */
export interface AudioManifest {
  music: Record<MusicId, string>
  ambience: Record<AmbienceId, string>
  sfx: Record<SfxId, string[]>
  playback: {
    adaptive_field: {
      frames: number
      sample_rate_hz: number
      crossfade_bars: number
    }
  }
}

/** Seconds per bar of the field layers from the manifest */
export const barSecondsOf = (m: AudioManifest) =>
  m.playback.adaptive_field.frames / m.playback.adaptive_field.sample_rate_hz / FIELD_BARS
