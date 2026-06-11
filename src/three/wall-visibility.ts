import type { Wall } from '../model/wall'

export type WallVisibilityMode = 'solid' | 'hidden' | 'translucent'

export const DEFAULT_WALL_OPACITY = 0.35

/** Partition walls have half-edges on both sides; perimeter walls have only one. */
export function isInteriorWall(wall: Wall): boolean {
  return wall.frontEdge != null && wall.backEdge != null
}
