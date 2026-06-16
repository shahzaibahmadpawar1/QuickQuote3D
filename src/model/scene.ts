import * as THREE from 'three'
import { Utils } from '../core/utils'
import { EventEmitter } from '../core/events'
import { Factory } from '../items/factory'
import type { Item } from '../items/item'
import { OnItemItem } from '../items/on_item'
import { WallItem } from '../items/wall_item'
import type { Model } from './model'
import type { Corner } from './corner'
import type { Room } from './room'
import type { Wall } from './wall'
import { JSONLoader } from '../loaders/JSONLoader'
import { GLBLoader } from '../loaders/GLBLoader'

/**
 * The Scene is a manager of Items and also links to a ThreeJS scene.
 */
export class Scene {
  /** The associated ThreeJS scene. */
  private scene: THREE.Scene

  /** */
  private items: Item[] = []

  /** */
  public needsUpdate = false

  /** The Json loader. */
  private jsonLoader: JSONLoader

  /** The GLB loader. */
  private glbLoader: GLBLoader

  /** */
  public itemLoadingCallbacks = new EventEmitter<void>()

  /** Item */
  public itemLoadedCallbacks = new EventEmitter<Item>()

  /** Item */
  public itemRemovedCallbacks = new EventEmitter<Item>()

  /** Item Load Error */
  public itemLoadErrorCallbacks = new EventEmitter<{ fileName: string; error: any }>()

  private mountChildren = new Map<Item, Set<Item>>()
  private childToHost = new Map<Item, Item>()

  /**
   * Constructs a scene.
   * @param model The associated model.
   * @param textureDir The directory from which to load the textures.
   */
  constructor(
    private model: Model,
    // @ts-ignore - textureDir is declared but not used, keeping for future use
    private textureDir: string
  ) {
    this.scene = new THREE.Scene()

    // init item loaders
    // Use custom JSONLoader for old three.js JSON format models
    this.jsonLoader = new JSONLoader()
    // Use GLBLoader for modern GLB/GLTF models
    this.glbLoader = new GLBLoader()
  }

  /** Adds a non-item, basically a mesh, to the scene.
   * @param mesh The mesh to be added.
   */
  public add(mesh: THREE.Mesh): void {
    this.scene.add(mesh)
  }

  /** Removes a non-item, basically a mesh, from the scene.
   * @param mesh The mesh to be removed.
   */
  public remove(mesh: THREE.Mesh): void {
    this.scene.remove(mesh)
    if (this.items.includes(mesh as unknown as Item)) {
      Utils.removeValue(this.items, mesh as unknown as Item)
    }
  }

  /** Gets the scene.
   * @returns The scene.
   */
  public getScene(): THREE.Scene {
    return this.scene
  }

  /** Gets the items.
   * @returns The items.
   */
  public getItems(): Item[] {
    return this.items
  }

  /** Gets the count of items.
   * @returns The count.
   */
  public itemCount(): number {
    return this.items.length
  }

  /** Removes all items. */
  public clearItems(): void {
    this.items.forEach((item) => {
      this.removeItem(item, true)
    })
    this.items = []
  }

  /**
   * Removes an item.
   * @param item The item to be removed.
   * @param dontRemove If not set, also remove the item from the items list.
   */
  public removeItem(item: Item, dontRemove: boolean = false): void {
    const mounted = this.mountChildren.get(item)
    if (mounted) {
      for (const child of [...mounted]) {
        this.removeItem(child)
      }
    }
    this.unregisterMount(item)

    // use this for item meshes
    this.itemRemovedCallbacks.fire(item)
    item.removed()
    this.scene.remove(item)
    if (!dontRemove) {
      Utils.removeValue(this.items, item)
    }
  }

  public registerMount(host: Item, child: Item): void {
    this.unregisterMount(child)
    let set = this.mountChildren.get(host)
    if (!set) {
      set = new Set()
      this.mountChildren.set(host, set)
    }
    set.add(child)
    this.childToHost.set(child, host)
  }

  public unregisterMount(child: Item): void {
    const host = this.childToHost.get(child)
    if (host) {
      const set = this.mountChildren.get(host)
      set?.delete(child)
      if (set && set.size === 0) {
        this.mountChildren.delete(host)
      }
      this.childToHost.delete(child)
    }
  }

  public syncMountedChildren(host: Item): void {
    const children = this.mountChildren.get(host)
    if (!children) return
    for (const child of children) {
      if (child instanceof OnItemItem) {
        child.syncToHost()
      }
    }
  }

  public resolvePendingMounts(item: Item): void {
    if (!(item instanceof OnItemItem)) return
    const parentKey = item.metadata?.parentItemKey
    if (parentKey && !item.getMountedHost()) {
      item.tryMountByParentKey(parentKey)
    }
  }

  /** Rebind wall items to recreated half-edges after floorplan.update(). */
  public refreshWallItemReferences(): void {
    for (const item of this.items) {
      if (item instanceof WallItem) {
        item.updateWallEdgeReference()
      }
    }
  }

  /** Translate items when a rigid wall-connected component moves (Lock mode). */
  public translateItemsForCorners(movedCornerIds: Set<string>, dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return

    const itemsToTranslate = new Set<Item>()

    for (const item of this.items) {
      if (item instanceof OnItemItem) continue

      if (item instanceof WallItem) {
        const wall = item.getAttachedWall()
        if (
          wall &&
          movedCornerIds.has(wall.getStart().id) &&
          movedCornerIds.has(wall.getEnd().id)
        ) {
          itemsToTranslate.add(item)
        }
      } else {
        for (const room of this.model.floorplan.getRooms()) {
          if (this.allRoomCornersInSet(room, movedCornerIds) && this.isItemCenterInRoom(item, room)) {
            itemsToTranslate.add(item)
            break
          }
        }
      }
    }

    this.applyTranslation(itemsToTranslate, dx, dy)
  }

  /** Translate items when a single wall segment moves (unlocked wall drag). */
  public translateItemsForWall(wall: Wall, dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return

    const itemsToTranslate = new Set<Item>()

    for (const item of [...wall.items, ...wall.onItems]) {
      itemsToTranslate.add(item)
    }

    for (const room of this.model.floorplan.getRooms()) {
      if (!this.roomHasWall(room, wall)) continue
      for (const item of this.items) {
        if (item instanceof WallItem || item instanceof OnItemItem) continue
        if (this.isItemCenterInRoom(item, room)) {
          itemsToTranslate.add(item)
        }
      }
    }

    this.applyTranslation(itemsToTranslate, dx, dy)
  }

  /** Translate items when a corner moves (corner drag). */
  public translateItemsForCorner(corner: Corner, dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return

    const itemsToTranslate = new Set<Item>()

    for (const connectedWall of this.model.floorplan.getWalls()) {
      if (
        connectedWall.getStart().id !== corner.id &&
        connectedWall.getEnd().id !== corner.id
      ) {
        continue
      }
      for (const item of [...connectedWall.items, ...connectedWall.onItems]) {
        itemsToTranslate.add(item)
      }
    }

    for (const room of this.model.floorplan.getRooms()) {
      if (!this.roomContainsCorner(room, corner)) continue
      for (const item of this.items) {
        if (item instanceof WallItem || item instanceof OnItemItem) continue
        if (this.isItemCenterInRoom(item, room)) {
          itemsToTranslate.add(item)
        }
      }
    }

    this.applyTranslation(itemsToTranslate, dx, dy)
  }

  private applyTranslation(itemsToTranslate: Set<Item>, dx: number, dy: number): void {
    for (const item of itemsToTranslate) {
      if (item instanceof OnItemItem) {
        const host = item.getMountedHost()
        if (host && itemsToTranslate.has(host)) continue
      }
      item.position.x += dx
      item.position.z += dy
    }

    for (const item of itemsToTranslate) {
      if (this.mountChildren.has(item)) {
        this.syncMountedChildren(item)
      }
    }

    this.needsUpdate = true
  }

  private roomLiveCorners(room: Room): { x: number; y: number }[] {
    return room.corners.map((corner) => ({ x: corner.x, y: corner.y }))
  }

  private isItemCenterInRoom(item: Item, room: Room): boolean {
    return Utils.pointInPolygon(item.position.x, item.position.z, this.roomLiveCorners(room))
  }

  private allRoomCornersInSet(room: Room, cornerIds: Set<string>): boolean {
    return room.corners.every((corner) => cornerIds.has(corner.id))
  }

  private roomContainsCorner(room: Room, corner: Corner): boolean {
    return room.corners.some((c) => c.id === corner.id)
  }

  private roomHasWall(room: Room, wall: Wall): boolean {
    const cornerIds = new Set(room.corners.map((c) => c.id))
    return cornerIds.has(wall.getStart().id) && cornerIds.has(wall.getEnd().id)
  }

  /**
   * Creates an item and adds it to the scene.
   * @param itemType The type of the item given by an enumerator.
   * @param fileName The name of the file to load.
   * @param metadata TODO
   * @param position The initial position.
   * @param rotation The initial rotation around the y axis.
   * @param scale The initial scaling.
   * @param fixed True if fixed.
   */
  public addItem(
    itemType: number,
    fileName: string,
    metadata: Record<string, unknown>,
    position?: THREE.Vector3,
    rotation?: number,
    scale?: THREE.Vector3,
    fixed?: boolean
  ): void {
    itemType = itemType || 1
    const scope = this
    const loaderCallback = (geometry: THREE.BufferGeometry, materials: THREE.Material[]) => {

      // Ensure materials are properly configured for visibility
      materials.forEach((mat) => {
        // Make sure materials are double-sided to avoid backface culling issues
        mat.side = THREE.DoubleSide
        // Enable depth testing and writing
        mat.depthTest = true
        mat.depthWrite = true
      })

      // Custom JSONLoader already returns BufferGeometry
      const item = new (Factory.getClass(itemType))(
        scope.model,
        metadata,
        geometry,
        materials, // Use actual materials from the loaded model
        position,
        rotation,
        scale
      )
      item.fixed = fixed || false
      scope.items.push(item)
      scope.add(item)

      item.initObject()
      scope.resolvePendingMounts(item)
      scope.itemLoadedCallbacks.fire(item)
    }

    this.itemLoadingCallbacks.fire()

    // Determine which loader to use based on file extension
    const isGLB = fileName.toLowerCase().endsWith('.glb') || fileName.toLowerCase().endsWith('.gltf')
    const loader = isGLB ? this.glbLoader : this.jsonLoader

    // Wrap in try-catch for better error handling
    try {
      loader.load(
        fileName,
        loaderCallback,
        undefined, // TODO_Ekki
        (error: any) => {
          console.error('Error loading model:', fileName, error)
          this.itemLoadErrorCallbacks.fire({ fileName, error })
        }
      )
    } catch (e) {
      console.error('Exception loading model:', e)
      this.itemLoadErrorCallbacks.fire({ fileName, error: e })
    }
  }
}
