import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

/**
 * Draco WASM/JS decoders are not published under `node_modules/three/.../draco/`
 * (no `.wasm` in npm). Loading `/draco/*` from the app origin therefore 404s.
 * unpkg serves the same tree as three.js releases, including full Draco binaries.
 */
function defaultDracoDecoderPath(): string {
  return `https://unpkg.com/three@0.${THREE.REVISION}.0/examples/jsm/libs/draco/`
}

/**
 * GLBLoader wrapper for loading GLB/GLTF models with Draco compression support.
 * Provides a similar interface to JSONLoader for easy migration.
 */
export class GLBLoader {
  private loader: GLTFLoader
  private dracoLoader: DRACOLoader
  private manager: THREE.LoadingManager

  constructor(manager?: THREE.LoadingManager) {
    this.manager = manager || THREE.DefaultLoadingManager

    // Initialize Draco loader
    this.dracoLoader = new DRACOLoader(this.manager)
    this.dracoLoader.setDecoderPath(defaultDracoDecoderPath())

    // Initialize GLTF loader with Draco support
    this.loader = new GLTFLoader(this.manager)
    this.loader.setDRACOLoader(this.dracoLoader)
  }

  /**
   * Load a GLB/GLTF file and extract geometry and materials.
   * Interface matches JSONLoader for compatibility with existing code.
   */
  load(
    url: string,
    onLoad: (geometry: THREE.BufferGeometry, materials: THREE.Material[]) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: Error) => void
  ): void {
    this.manager.itemStart(url)

    this.loader.load(
      url,
      (gltf) => {
        try {
          const { geometry, materials } = this.extractGeometryAndMaterials(gltf)
          onLoad(geometry, materials)
          this.manager.itemEnd(url)
        } catch (e) {
          console.error('GLBLoader extraction error:', e)
          if (onError) {
            onError(e as Error)
          }
          this.manager.itemError(url)
          this.manager.itemEnd(url)
        }
      },
      onProgress as (event: ProgressEvent<EventTarget>) => void,
      (error: unknown) => {
        console.error('GLBLoader load error:', error)
        if (onError) {
          onError(error instanceof Error ? error : new Error(String(error)))
        }
        this.manager.itemError(url)
        this.manager.itemEnd(url)
      }
    )
  }

  /**
   * Extract merged geometry and materials from GLTF scene.
   * GLB models may contain multiple meshes, so we merge them.
   */
  private extractGeometryAndMaterials(gltf: { scene: THREE.Group }): {
    geometry: THREE.BufferGeometry
    materials: THREE.Material[]
  } {
    const geometries: THREE.BufferGeometry[] = []
    const materials: THREE.Material[] = []
    const materialMap = new Map<THREE.Material, number>()

    // Traverse the scene to find all meshes
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mesh = child as THREE.Mesh

        // Clone and apply world transform to geometry
        const geom = mesh.geometry.clone()
        mesh.updateWorldMatrix(true, false)
        geom.applyMatrix4(mesh.matrixWorld)

        // Handle materials (single or array)
        const meshMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

        // Update geometry groups to use correct material indices
        if (geom.groups.length === 0) {
          // No groups defined, create one for the entire geometry
          const matIndex = this.getOrAddMaterial(meshMaterials[0], materials, materialMap)
          geom.addGroup(0, geom.index ? geom.index.count : geom.attributes.position.count, matIndex)
        } else {
          // Update existing group material indices
          for (const group of geom.groups) {
            const originalMat = meshMaterials[group.materialIndex || 0]
            group.materialIndex = this.getOrAddMaterial(originalMat, materials, materialMap)
          }
        }

        geometries.push(geom)
      }
    })

    if (geometries.length === 0) {
      throw new Error('No meshes found in GLB file')
    }

    // Merge all geometries
    let mergedGeometry: THREE.BufferGeometry

    if (geometries.length === 1) {
      mergedGeometry = geometries[0]
    } else {
      mergedGeometry = this.mergeGeometries(geometries)
    }

    // Normalize units to this project's centimeters coordinate system.
    // Many user-uploaded GLBs are authored in cm/mm instead of meters.
    const scaleFactor = this.getUnitScaleFactor(mergedGeometry)
    mergedGeometry.scale(scaleFactor, scaleFactor, scaleFactor)

    // Safety clamp: avoid extremely large models that can swallow the whole scene.
    this.clampOversizedGeometry(mergedGeometry)

    // Ensure bounding box and sphere are computed
    mergedGeometry.computeBoundingBox()
    mergedGeometry.computeBoundingSphere()

    // Configure materials for visibility and convert to MeshPhongMaterial if needed
    const processedMaterials = materials.map((mat) => {
      // Convert MeshStandardMaterial to MeshPhongMaterial for better compatibility
      // with the existing lighting setup (no environment map)
      if (mat instanceof THREE.MeshStandardMaterial) {
        const phongMat = new THREE.MeshPhongMaterial({
          color: mat.color,
          map: mat.map,
          normalMap: mat.normalMap,
          emissive: mat.emissive,
          emissiveMap: mat.emissiveMap,
          emissiveIntensity: mat.emissiveIntensity,
          specular: new THREE.Color(0x222222),  // Very subtle specular to avoid moiré
          shininess: 5,  // Very matte finish
          side: THREE.DoubleSide,
          transparent: mat.transparent,
          opacity: mat.opacity,
          alphaTest: mat.alphaTest
        })

        // Copy texture properties
        if (mat.map) {
          phongMat.map = mat.map
        }

        return phongMat
      }

      // For other materials, just configure side and depth
      mat.side = THREE.DoubleSide
      mat.depthTest = true
      mat.depthWrite = true
      return mat
    })

    return { geometry: mergedGeometry, materials: processedMaterials }
  }

  /**
   * Infer source units and return scale factor to convert to centimeters.
   * Heuristic by raw bounding-box max dimension:
   * - <= 20   : likely meters -> x100
   * - 20..500 : likely centimeters -> x1
   * - > 500   : likely millimeters -> x0.1
   */
  private getUnitScaleFactor(geometry: THREE.BufferGeometry): number {
    geometry.computeBoundingBox()
    const bbox = geometry.boundingBox
    if (!bbox) return 100

    const size = new THREE.Vector3()
    bbox.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)

    if (maxDim > 500) return 0.1
    if (maxDim > 20) return 1
    return 100
  }

  /**
   * Clamp unusually large models so they still appear inside typical rooms.
   */
  private clampOversizedGeometry(geometry: THREE.BufferGeometry): void {
    geometry.computeBoundingBox()
    const bbox = geometry.boundingBox
    if (!bbox) return

    const size = new THREE.Vector3()
    bbox.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    const maxAllowedCm = 800
    if (maxDim > maxAllowedCm) {
      const factor = maxAllowedCm / maxDim
      geometry.scale(factor, factor, factor)
    }
  }

  /**
   * Get existing material index or add new material to array.
   */
  private getOrAddMaterial(
    material: THREE.Material,
    materials: THREE.Material[],
    materialMap: Map<THREE.Material, number>
  ): number {
    if (materialMap.has(material)) {
      return materialMap.get(material)!
    }
    const index = materials.length
    materials.push(material)
    materialMap.set(material, index)
    return index
  }

  /**
   * Merge multiple geometries into one, preserving material groups.
   */
  private mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    const merged = new THREE.BufferGeometry()

    // Collect all attributes
    const positions: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    const groups: { start: number; count: number; materialIndex: number }[] = []

    let indexOffset = 0
    let vertexOffset = 0

    for (const geom of geometries) {
      const posAttr = geom.attributes.position
      const normAttr = geom.attributes.normal
      const uvAttr = geom.attributes.uv

      // Add positions
      for (let i = 0; i < posAttr.count; i++) {
        positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i))
      }

      // Add normals
      if (normAttr) {
        for (let i = 0; i < normAttr.count; i++) {
          normals.push(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i))
        }
      }

      // Add UVs
      if (uvAttr) {
        for (let i = 0; i < uvAttr.count; i++) {
          uvs.push(uvAttr.getX(i), uvAttr.getY(i))
        }
      }

      // Add indices with offset
      if (geom.index) {
        const indexArray = geom.index.array
        for (let i = 0; i < indexArray.length; i++) {
          indices.push(indexArray[i] + vertexOffset)
        }
      } else {
        // Generate indices for non-indexed geometry
        for (let i = 0; i < posAttr.count; i++) {
          indices.push(i + vertexOffset)
        }
      }

      // Add groups with offset
      for (const group of geom.groups) {
        groups.push({
          start: group.start + indexOffset,
          count: group.count,
          materialIndex: group.materialIndex || 0
        })
      }

      indexOffset += geom.index ? geom.index.count : posAttr.count
      vertexOffset += posAttr.count
    }

    // Set attributes
    merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    if (normals.length > 0) {
      merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    }
    if (uvs.length > 0) {
      merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    }
    merged.setIndex(indices)

    // Set groups
    for (const group of groups) {
      merged.addGroup(group.start, group.count, group.materialIndex)
    }

    return merged
  }

  /**
   * Dispose of the Draco loader to free resources.
   */
  dispose(): void {
    this.dracoLoader.dispose()
  }
}
