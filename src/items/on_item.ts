import * as THREE from 'three'
import { Utils } from '../core/utils'
import { Model } from '../model/model'
import { Item } from './item'
import { Metadata } from './metadata'
import { getMountTopY, isMountHost, positionOnMount } from './mount-utils'

/**
 * An item placed on top of floor furniture (e.g. vase on a table).
 */
export class OnItemItem extends Item {
  private mountedHost: Item | null = null
  private mountOffsetX = 0
  private mountOffsetZ = 0
  private dragPlane: THREE.Mesh | null = null

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
    this.obstructFloorMoves = false
    this.receiveShadow = true
  }

  public getMountedHost(): Item | null {
    return this.mountedHost
  }

  public mountTo(host: Item, x?: number, z?: number): void {
    if (!isMountHost(host)) return
    if (this.mountedHost && this.mountedHost !== host) {
      this.model.scene.unregisterMount(this)
    }
    this.mountedHost = host
    const px = x ?? host.position.x
    const pz = z ?? host.position.z
    this.mountOffsetX = px - host.position.x
    this.mountOffsetZ = pz - host.position.z
    positionOnMount(this, host, px, pz)
    this.model.scene.registerMount(host, this)
    this.updateDragPlane()
  }

  public tryMountByParentKey(parentItemKey: string | undefined): boolean {
    if (!parentItemKey) return false
    const host = this.model.scene
      .getItems()
      .find((item) => item.metadata?.itemKey === parentItemKey && isMountHost(item))
    if (!host) return false
    this.mountTo(host, this.position.x, this.position.z)
    return true
  }

  public placeInRoom(): void {
    const parentKey = (this.metadata as Metadata & { parentItemKey?: string }).parentItemKey
    if (parentKey && this.tryMountByParentKey(parentKey)) {
      return
    }
    if (!this.position_set) {
      const center = this.model.floorplan.getCenter()
      this.position.x = center.x
      this.position.z = center.z
    }
    this.position.y = this.halfSize.y
  }

  protected resized(): void {
    if (this.mountedHost) {
      positionOnMount(
        this,
        this.mountedHost,
        this.mountedHost.position.x + this.mountOffsetX,
        this.mountedHost.position.z + this.mountOffsetZ
      )
    }
    this.updateDragPlane()
  }

  public removed(): void {
    this.model.scene.unregisterMount(this)
    this.mountedHost = null
  }

  private updateDragPlane(): void {
    if (this.dragPlane) {
      this.model.scene.getScene().remove(this.dragPlane)
      this.dragPlane = null
    }
    const y = this.mountedHost ? getMountTopY(this.mountedHost) : this.position.y - this.halfSize.y
    const size = 8000
    const geometry = new THREE.PlaneGeometry(size, size)
    geometry.rotateX(-Math.PI / 2)
    this.dragPlane = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    )
    this.dragPlane.position.y = y + 0.01
    this.model.scene.getScene().add(this.dragPlane)
  }

  public customIntersectionPlanes(): THREE.Mesh[] {
    if (!this.dragPlane) {
      this.updateDragPlane()
    }
    return this.dragPlane ? [this.dragPlane] : this.model.floorplan.floorPlanes()
  }

  public moveToPosition(vec3: THREE.Vector3, _intersection: THREE.Intersection | null): void {
    if (this.mountedHost) {
      if (!this.isValidPosition(vec3)) {
        this.showError(vec3)
        return
      }
      this.hideError()
      this.mountOffsetX = vec3.x - this.mountedHost.position.x
      this.mountOffsetZ = vec3.z - this.mountedHost.position.z
      positionOnMount(
        this,
        this.mountedHost,
        this.mountedHost.position.x + this.mountOffsetX,
        this.mountedHost.position.z + this.mountOffsetZ
      )
      return
    }

    const hosts = this.model.scene.getItems().filter(isMountHost)
    for (const host of hosts) {
      const topY = getMountTopY(host)
      const dx = vec3.x - host.position.x
      const dz = vec3.z - host.position.z
      if (Math.abs(dx) <= host.halfSize.x && Math.abs(dz) <= host.halfSize.z) {
        this.mountTo(host, vec3.x, vec3.z)
        return
      }
      if (
        Utils.pointInPolygon(vec3.x, vec3.z, host.getCorners('x', 'z', host.position)) &&
        vec3.y >= topY - 5
      ) {
        this.mountTo(host, vec3.x, vec3.z)
        return
      }
    }

    if (!this.isValidPosition(vec3)) {
      this.showError(vec3)
      return
    }
    this.hideError()
    vec3.y = this.halfSize.y
    this.position.copy(vec3)
  }

  public clickReleased(): void {
    super.clickReleased()
    if (this.mountedHost) {
      this.updateDragPlane()
    }
  }

  public isValidPosition(vec3: THREE.Vector3): boolean {
    if (!this.mountedHost) {
      return false
    }
    const host = this.mountedHost
    const corners = this.getCorners('x', 'z', vec3)
    const hostCorners = host.getCorners('x', 'z', host.position)
    for (const corner of corners) {
      if (!Utils.pointInPolygon(corner.x, corner.y, hostCorners)) {
        return false
      }
    }
    return true
  }

  public syncToHost(): void {
    if (!this.mountedHost) return
    positionOnMount(
      this,
      this.mountedHost,
      this.mountedHost.position.x + this.mountOffsetX,
      this.mountedHost.position.z + this.mountOffsetZ
    )
    this.updateDragPlane()
  }
}
