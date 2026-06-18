import * as THREE from 'three'
import { Utils } from '../core/utils'
import type { Floorplan } from '../model/floorplan'

/** 2D footprint corners (plan x → x, plan y → z) for a centered box on the floor. */
export function getFootprintCorners(
  x: number,
  z: number,
  halfX: number,
  halfZ: number,
  rotationY: number
): { x: number; y: number }[] {
  const c1 = new THREE.Vector3(-halfX, 0, -halfZ)
  const c2 = new THREE.Vector3(halfX, 0, -halfZ)
  const c3 = new THREE.Vector3(halfX, 0, halfZ)
  const c4 = new THREE.Vector3(-halfX, 0, halfZ)

  const transform = new THREE.Matrix4().makeRotationY(rotationY)
  c1.applyMatrix4(transform)
  c2.applyMatrix4(transform)
  c3.applyMatrix4(transform)
  c4.applyMatrix4(transform)

  const origin = new THREE.Vector3(x, 0, z)
  c1.add(origin)
  c2.add(origin)
  c3.add(origin)
  c4.add(origin)

  return [
    { x: c1.x, y: c1.z },
    { x: c2.x, y: c2.z },
    { x: c3.x, y: c3.z },
    { x: c4.x, y: c4.z }
  ]
}

/** True when the full footprint lies inside one room interior (no wall clipping). */
export function isFootprintInAnyRoom(
  floorplan: Floorplan,
  x: number,
  z: number,
  halfX: number,
  halfZ: number,
  rotationY: number
): boolean {
  const corners = getFootprintCorners(x, z, halfX, halfZ, rotationY)

  for (const room of floorplan.getRooms()) {
    const poly = room.interiorCorners
    if (poly.length < 3) continue
    if (!Utils.pointInPolygon(x, z, poly)) continue
    if (corners.every((c) => Utils.pointInPolygon(c.x, c.y, poly))) {
      return true
    }
  }

  return false
}
