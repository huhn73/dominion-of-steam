/**
 * World shapes of the map generator: one continent (the classic noise world), islands with one
 * home island per seat, or an archipelago of many small islands. One source for the setup wizard,
 * the server, the lobby labels, the simulation and the engine.
 */
export interface WorldShapeOption {
  id: WorldShape
  label: string
  description: string
}

export type WorldShape = 'continent' | 'islands' | 'archipelago'

export const DEFAULT_WORLD_SHAPE: WorldShape = 'continent'

export const WORLD_SHAPES: WorldShapeOption[] = [
  {
    id: 'continent',
    label: 'Kontinent',
    description: 'Eine große Landmasse mit Buchten und ein paar vorgelagerten Inseln.',
  },
  {
    id: 'islands',
    label: 'Inseln',
    description: 'Jede Hauptstadt auf einer eigenen Insel, dazwischen neutrale Inseln.',
  },
  {
    id: 'archipelago',
    label: 'Archipel',
    description: 'Viele kleine Inseln, Seewege entscheiden; am besten mit 20 bis 30 % Land.',
  },
]

export const isWorldShape = (x: unknown): x is WorldShape => WORLD_SHAPES.some((s) => s.id === x)

export const worldShapeLabel = (id: WorldShape | null | undefined) =>
  WORLD_SHAPES.find((s) => s.id === (id ?? DEFAULT_WORLD_SHAPE))?.label ?? 'Kontinent'
