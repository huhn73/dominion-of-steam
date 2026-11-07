import type { MessageKey } from '../i18n'
/**
 * World shapes of the map generator: one continent (the classic noise world), islands with one
 * home island per seat, or an archipelago of many small islands. One source for the setup wizard,
 * the server, the lobby labels, the simulation and the engine.
 */
export interface WorldShapeOption {
  id: WorldShape
  label: MessageKey
  description: MessageKey
}

export type WorldShape = 'continent' | 'islands' | 'archipelago'

export const DEFAULT_WORLD_SHAPE: WorldShape = 'continent'

export const WORLD_SHAPES: WorldShapeOption[] = [
  {
    id: 'continent',
    label: 'setup.shape.continent.label',
    description: 'setup.shape.continent.description',
  },
  {
    id: 'islands',
    label: 'setup.shape.islands.label',
    description: 'setup.shape.islands.description',
  },
  {
    id: 'archipelago',
    label: 'setup.shape.archipelago.label',
    description: 'setup.shape.archipelago.description',
  },
]

export const isWorldShape = (x: unknown): x is WorldShape => WORLD_SHAPES.some((s) => s.id === x)

export const worldShapeLabel = (id: WorldShape | null | undefined): MessageKey =>
  WORLD_SHAPES.find((s) => s.id === (id ?? DEFAULT_WORLD_SHAPE))?.label ??
  'setup.shape.continent.label'
