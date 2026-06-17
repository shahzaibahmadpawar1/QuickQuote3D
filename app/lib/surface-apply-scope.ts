import type { Floorplan, HalfEdge, Room } from '@blueprint3d'

export type SurfaceApplyScope = 'selected' | 'structure' | 'all'

export function getFloorApplyTargets(
  floorplan: Floorplan,
  selectedRoom: Room,
  scope: SurfaceApplyScope
): Room[] {
  switch (scope) {
    case 'selected':
      return [selectedRoom]
    case 'all':
      return floorplan.getRooms()
    case 'structure': {
      const cornerIds = floorplan.getConnectedCornerIds(selectedRoom.corners)
      return floorplan.getRoomsInCornerSet(cornerIds)
    }
  }
}

export function getWallApplyTargets(
  floorplan: Floorplan,
  selectedEdge: HalfEdge,
  scope: SurfaceApplyScope
): HalfEdge[] {
  switch (scope) {
    case 'selected':
      return [selectedEdge]
    case 'all':
      return floorplan.wallEdges()
    case 'structure': {
      const cornerIds = floorplan.getConnectedCornerIdsForWall(selectedEdge.wall)
      return floorplan.getWallEdgesInCornerSet(cornerIds)
    }
  }
}
