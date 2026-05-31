import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import type { Item } from '@blueprint3d/items/item'
import {
  findMountHostFromHits,
  getMountHostMeshes,
  getMountTopY,
  isMountHost,
  positionOnMount
} from '@blueprint3d/items/mount-utils'

function mockItem(type: number, y = 0, halfY = 50): Item {
  return {
    metadata: { itemType: type },
    position: new THREE.Vector3(0, y, 0),
    halfSize: new THREE.Vector3(40, halfY, 40)
  } as Item
}

describe('isMountHost', () => {
  it('accepts floor furniture types 1, 8, 10', () => {
    expect(isMountHost(mockItem(1))).toBe(true)
    expect(isMountHost(mockItem(8))).toBe(true)
    expect(isMountHost(mockItem(10))).toBe(true)
  })

  it('rejects wall, door, and on-item types', () => {
    expect(isMountHost(mockItem(3))).toBe(false)
    expect(isMountHost(mockItem(7))).toBe(false)
    expect(isMountHost(mockItem(12))).toBe(false)
  })
})

describe('getMountTopY', () => {
  it('returns position.y plus halfSize.y', () => {
    expect(getMountTopY(mockItem(1, 10, 25))).toBe(35)
  })
})

describe('positionOnMount', () => {
  it('places child on top of host at x/z', () => {
    const host = mockItem(1, 0, 40)
    const child = mockItem(12, 0, 10)
    positionOnMount(child, host, 100, 200)
    expect(child.position.x).toBe(100)
    expect(child.position.z).toBe(200)
    expect(child.position.y).toBe(50)
  })
})

describe('getMountHostMeshes', () => {
  it('filters to mount hosts only', () => {
    const items = [mockItem(1), mockItem(3), mockItem(10)]
    expect(getMountHostMeshes(items)).toHaveLength(2)
  })
})

describe('findMountHostFromHits', () => {
  it('walks parent chain to find a mount host', () => {
    const hostMesh = new THREE.Mesh() as unknown as Item
    hostMesh.metadata = { itemType: 8 }
    const childMesh = new THREE.Mesh()
    hostMesh.add(childMesh)

    const hit = {
      object: childMesh,
      point: new THREE.Vector3(5, 80, 5),
      distance: 0
    } as THREE.Intersection

    const found = findMountHostFromHits([hostMesh, mockItem(3)], [hit])
    expect(found?.host).toBe(hostMesh)
    expect(found?.point.x).toBe(5)
  })

  it('returns null when no host is hit', () => {
    const mesh = new THREE.Mesh()
    const hit = {
      object: mesh,
      point: new THREE.Vector3(),
      distance: 0
    } as THREE.Intersection
    expect(findMountHostFromHits([mockItem(1)], [hit])).toBeNull()
  })
})
