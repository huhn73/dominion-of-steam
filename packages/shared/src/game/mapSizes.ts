import type { Message, MessageKey } from '../i18n'
/**
 * The five map tiers (square, geometric steps). One source for the setup wizard, the server,
 * the lobby labels and the engine; `MapSizeId` is derived from it.
 */
export interface MapSizeOption {
  id: MapSizeId
  label: MessageKey
  width: number
  height: number
  /** [min, max] players that fit this size well */
  recommendedPlayers: [number, number]
  /** Round limit the setup suggests for this size */
  defaultRoundLimit: number
}

const define = <T extends Record<string, Omit<MapSizeOption, 'id'>>>(sizes: T) => sizes

const SIZES = define({
  small: {
    label: 'setup.size.small',
    width: 20,
    height: 20,
    recommendedPlayers: [2, 3],
    defaultRoundLimit: 50,
  },
  medium: {
    label: 'setup.size.medium',
    width: 40,
    height: 40,
    recommendedPlayers: [2, 4],
    defaultRoundLimit: 150,
  },
  large: {
    label: 'setup.size.large',
    width: 75,
    height: 75,
    recommendedPlayers: [3, 6],
    defaultRoundLimit: 150,
  },
  huge: {
    label: 'setup.size.huge',
    width: 130,
    height: 130,
    recommendedPlayers: [4, 6],
    defaultRoundLimit: 250,
  },
  empire: {
    label: 'setup.size.empire',
    width: 200,
    height: 200,
    recommendedPlayers: [4, 6],
    defaultRoundLimit: 500,
  },
})

export type MapSizeId = keyof typeof SIZES

export const MAP_SIZES: Record<MapSizeId, MapSizeOption> = Object.fromEntries(
  (Object.keys(SIZES) as MapSizeId[]).map((id) => [id, { id, ...SIZES[id] }]),
) as Record<MapSizeId, MapSizeOption>

export const MAP_SIZE_OPTIONS: MapSizeOption[] = Object.values(MAP_SIZES)

/** Longest side any map may have (command coordinates are checked against it) */
export const MAX_MAP_SIDE = 256

export const mapSize = (id: string | null | undefined): MapSizeOption | undefined =>
  id != null && id in MAP_SIZES ? MAP_SIZES[id as MapSizeId] : undefined

/** Tier label when the dimensions match a tier, otherwise "14×10" (matches from older tiers) */
export const mapSizeLabel = (width: number, height: number): Message => {
  const tier = MAP_SIZE_OPTIONS.find((s) => s.width === width && s.height === height)
  return tier ? { key: tier.label } : { key: 'setup.sizeDims', params: { width, height } }
}
