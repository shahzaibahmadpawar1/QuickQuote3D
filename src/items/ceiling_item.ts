import * as THREE from 'three'
import { Utils } from '../core/utils'
import { Model } from '../model/model'
import { Item } from './item'
import { Metadata } from './metadata'

/**
 * A Ceiling Item is attached to the room ceiling and moved in X/Z.
 */
export class CeilingItem extends Item {
  constructor(
    model: Model,
    metadata: Metadata,
    geometry: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[],
    position?: THREE.Vector3,
    rotation?: number,
    scale?: THREE.Vector3
  ) {
    super(model, metadata, geometry, material, position, rotation, scale)
    this.receiveShadow = false
  }

  private getCeilingHeight(): number {
    const rooms = this.model.floorplan.getRooms()
    if (rooms.length > 0) {
      return Math.max(...rooms.map((room) => room.getCeilingHeight()))
    }
    return 250
  }

  private getMountedY(): number {
    // Keep item touching the ceiling from below.
    return this.getCeilingHeight() - this.halfSize.y - 0.01
  }

  public placeInRoom(): void {
    if (!this.position_set) {
      const center = this.model.floorplan.getCenter()
      this.position.x = center.x
      this.position.z = center.z
    }
    this.position.y = this.getMountedY()
  }

  protected resized(): void {
    this.position.y = this.getMountedY()
  }

  public customIntersectionPlanes(): THREE.Mesh[] {
    // Use floor planes for drag intersections. Ceiling planes can be filtered
    // out by ray normal checks depending on camera orientation/face direction.
    // Y is still constrained to mounted ceiling height in moveToPosition().
    return this.model.floorplan.floorPlanes()
  }

  public moveToPosition(vec3: THREE.Vector3): void {
    if (!this.isValidPosition(vec3)) {
      this.showError(vec3)
      return
    }
    this.hideError()
    vec3.y = this.getMountedY()
    this.position.copy(vec3)
  }

  public isValidPosition(vec3: THREE.Vector3): boolean {
    const corners = this.getCorners('x', 'z', vec3)
    const rooms = this.model.floorplan.getRooms()
    for (let i = 0; i < rooms.length; i++) {
      const poly = rooms[i].interiorCorners
      if (poly.length < 3) continue
      if (!Utils.pointInPolygon(vec3.x, vec3.z, poly)) continue
      if (corners.every((c) => Utils.pointInPolygon(c.x, c.y, poly))) {
        return true
      }
    }
    return false
  }
}
