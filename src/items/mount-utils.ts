import * as THREE from 'three'
import type { Item } from './item'

/** Floor-placed furniture that can host surface decorations. */
const MOUNT_HOST_TYPES = new Set([1, 8, 10])

export function isMountHost(item: Item): boolean {
  const type = item.metadata?.itemType
  return type != null && MOUNT_HOST_TYPES.has(type)
}

export function getMountTopY(host: Item): number {
  return host.position.y + host.halfSize.y
}

export function positionOnMount(child: Item, host: Item, x: number, z: number): void {
  child.position.set(x, getMountTopY(host) + child.halfSize.y, z)
}

export function findMountHostFromHits(
  items: Item[],
  hits: THREE.Intersection[]
): { host: Item; point: THREE.Vector3 } | null {
  for (const hit of hits) {
    let obj: THREE.Object3D | null = hit.object
    while (obj) {
      const candidate = obj as unknown as Item
      if (items.includes(candidate) && isMountHost(candidate)) {
        return { host: candidate, point: hit.point.clone() }
      }
      obj = obj.parent
    }
  }
  return null
}

export function getMountHostMeshes(items: Item[]): Item[] {
  return items.filter(isMountHost)
}
