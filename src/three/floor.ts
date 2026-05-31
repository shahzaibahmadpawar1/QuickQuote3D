import * as THREE from 'three'
import type { Room } from '../model/room'

export class Floor {
  public readonly room: Room
  private readonly scene: THREE.Scene
  private readonly renderer: THREE.WebGLRenderer
  private floorPlane: THREE.Mesh | null = null
  private roofPlane: THREE.Mesh | null = null
  private roofVisible = false

  constructor(scene: THREE.Scene, room: Room, renderer: THREE.WebGLRenderer) {
    this.scene = scene
    this.room = room
    this.renderer = renderer
    this.init()
  }

  private init(): void {
    this.room.fireOnFloorChange(this.redraw.bind(this))
    this.floorPlane = this.buildFloor()
    this.roofPlane = this.buildRoof()
  }

  private redraw(): void {
    this.removeFromScene()
    this.floorPlane = this.buildFloor()
    this.roofPlane = this.buildRoof()
    if (this.roofPlane) {
      this.roofPlane.visible = this.roofVisible
    }
    this.addToScene()
  }

  private buildFloor(): THREE.Mesh {
    const textureSettings = this.room.getTexture()
    const url = textureSettings?.url?.trim() ?? ''
    const hasTexture = url.length > 0

    let floorMaterialTop: THREE.MeshPhongMaterial
    let textureScale = 1

    if (hasTexture && textureSettings) {
      const textureLoader = new THREE.TextureLoader()
      const floorTexture = textureLoader.load(url)
      floorTexture.wrapS = THREE.RepeatWrapping
      floorTexture.wrapT = THREE.RepeatWrapping
      floorTexture.repeat.set(1, 1)
      floorTexture.colorSpace = THREE.SRGBColorSpace
      floorTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
      floorTexture.minFilter = THREE.LinearMipmapLinearFilter
      floorTexture.magFilter = THREE.LinearFilter
      floorMaterialTop = new THREE.MeshPhongMaterial({
        map: floorTexture,
        side: THREE.DoubleSide,
        color: 0xffffff,
        specular: 0x111111,
        shininess: 3
      })
      textureScale = textureSettings.scale
    } else {
      floorMaterialTop = new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
        color: 0xf5f5f0,
        specular: 0x111111,
        shininess: 3
      })
    }

    const points: THREE.Vector2[] = []
    this.room.interiorCorners.forEach((corner) => {
      if (hasTexture) {
        points.push(new THREE.Vector2(corner.x / textureScale, corner.y / textureScale))
      } else {
        points.push(new THREE.Vector2(corner.x, corner.y))
      }
    })
    const shape = new THREE.Shape(points)

    const geometry = new THREE.ShapeGeometry(shape)

    const floor = new THREE.Mesh(geometry, floorMaterialTop)

    floor.rotation.set(Math.PI / 2, 0, 0)
    if (hasTexture) {
      floor.scale.set(textureScale, textureScale, textureScale)
    }
    floor.receiveShadow = true
    floor.castShadow = false
    return floor
  }

  // @ts-ignore - buildRoof is declared but not used, keeping for future use
  private buildRoof(): THREE.Mesh {
    const roofMaterial = new THREE.MeshPhongMaterial({
      side: THREE.DoubleSide,
      color: 0xf1f1f1,
      shininess: 2
    })

    const points: THREE.Vector2[] = []
    this.room.interiorCorners.forEach((corner) => {
      points.push(new THREE.Vector2(corner.x, corner.y))
    })
    const shape = new THREE.Shape(points)
    const geometry = new THREE.ShapeGeometry(shape)
    const roof = new THREE.Mesh(geometry, roofMaterial)

    roof.rotation.set(Math.PI / 2, 0, 0)
    roof.position.y = this.room.getCeilingHeight()
    roof.receiveShadow = true
    roof.castShadow = false
    return roof
  }

  public addToScene(): void {
    if (this.floorPlane) {
      this.scene.add(this.floorPlane)
    }
    if (this.roofPlane) {
      this.roofPlane.visible = this.roofVisible
      this.scene.add(this.roofPlane)
    }
    // hack so we can do intersect testing
    this.scene.add(this.room.floorPlane)
    this.scene.add(this.room.ceilingPlane)
  }

  public removeFromScene(): void {
    if (this.floorPlane) {
      this.scene.remove(this.floorPlane)
    }
    if (this.roofPlane) {
      this.scene.remove(this.roofPlane)
    }
    this.scene.remove(this.room.floorPlane)
    this.scene.remove(this.room.ceilingPlane)
  }

  public setRoofVisible(visible: boolean): void {
    this.roofVisible = visible
    if (this.roofPlane) {
      this.roofPlane.visible = visible
    }
  }
}
