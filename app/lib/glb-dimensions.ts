import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import type { UserItemCategory } from '@/types/user-item'

const MAX_ALLOWED_CM = 800

export interface GlbDimensionResult {
  widthCm: number
  heightCm: number
  depthCm: number
  wasUnitScaled: boolean
  wasClamped: boolean
  wasCategoryNormalized: boolean
}

type AnchorMode = 'height' | 'longestHorizontal' | 'maxDimension'

interface CategoryNorm {
  mode: AnchorMode
  min: number
  max: number
  target: number
}

const CATEGORY_NORMS: Record<UserItemCategory, CategoryNorm> = {
  chair: { mode: 'height', min: 40, max: 110, target: 85 },
  stool: { mode: 'height', min: 30, max: 65, target: 45 },
  armchair: { mode: 'height', min: 50, max: 110, target: 85 },
  table: { mode: 'height', min: 65, max: 90, target: 75 },
  bed: { mode: 'longestHorizontal', min: 180, max: 220, target: 200 },
  sofa: { mode: 'longestHorizontal', min: 150, max: 250, target: 200 },
  wardrobe: { mode: 'height', min: 150, max: 230, target: 200 },
  drawer: { mode: 'height', min: 60, max: 120, target: 90 },
  storage: { mode: 'height', min: 60, max: 200, target: 120 },
  light: { mode: 'maxDimension', min: 15, max: 80, target: 40 },
  door: { mode: 'height', min: 190, max: 230, target: 210 },
  window: { mode: 'height', min: 80, max: 160, target: 120 },
  decoration: { mode: 'maxDimension', min: 10, max: 60, target: 25 }
}

let sharedLoader: GLTFLoader | null = null
let sharedDraco: DRACOLoader | null = null

function getGltfLoader(): GLTFLoader {
  if (sharedLoader) return sharedLoader
  sharedDraco = new DRACOLoader()
  sharedDraco.setDecoderPath(`https://unpkg.com/three@0.${THREE.REVISION}.0/examples/jsm/libs/draco/`)
  sharedLoader = new GLTFLoader()
  sharedLoader.setDRACOLoader(sharedDraco)
  return sharedLoader
}

/** Matches GLBLoader unit heuristic (raw max dimension before cm conversion). */
export function getUnitScaleFactorFromMaxDim(maxDim: number): number {
  if (maxDim > 500) return 0.1
  if (maxDim > 20) return 1
  return 100
}

export function pickAnchorValue(
  widthCm: number,
  heightCm: number,
  depthCm: number,
  mode: AnchorMode
): number {
  if (mode === 'height') return heightCm
  if (mode === 'longestHorizontal') return Math.max(widthCm, depthCm)
  return Math.max(widthCm, heightCm, depthCm)
}

/** Uniform scale so anchor falls within category range; preserves proportions. */
export function normalizeDimensionsByCategory(
  widthCm: number,
  heightCm: number,
  depthCm: number,
  category: UserItemCategory
): { widthCm: number; heightCm: number; depthCm: number; wasCategoryNormalized: boolean } {
  const norm = CATEGORY_NORMS[category]
  const anchor = pickAnchorValue(widthCm, heightCm, depthCm, norm.mode)

  if (!Number.isFinite(anchor) || anchor <= 0) {
    return { widthCm, heightCm, depthCm, wasCategoryNormalized: false }
  }

  if (anchor >= norm.min && anchor <= norm.max) {
    return { widthCm, heightCm, depthCm, wasCategoryNormalized: false }
  }

  const scale = norm.target / anchor
  return {
    widthCm: widthCm * scale,
    heightCm: heightCm * scale,
    depthCm: depthCm * scale,
    wasCategoryNormalized: true
  }
}

function roundCm(value: number): number {
  return Number(value.toFixed(2))
}

export function dimensionsFromRawSize(
  size: THREE.Vector3,
  category: UserItemCategory
): GlbDimensionResult {
  const rawMax = Math.max(size.x, size.y, size.z)
  const unitScale = getUnitScaleFactorFromMaxDim(rawMax)
  const wasUnitScaled = unitScale !== 1

  let widthCm = size.x * unitScale
  let heightCm = size.y * unitScale
  let depthCm = size.z * unitScale

  let wasClamped = false
  const maxDim = Math.max(widthCm, heightCm, depthCm)
  if (maxDim > MAX_ALLOWED_CM) {
    const factor = MAX_ALLOWED_CM / maxDim
    widthCm *= factor
    heightCm *= factor
    depthCm *= factor
    wasClamped = true
  }

  const normalized = normalizeDimensionsByCategory(widthCm, heightCm, depthCm, category)

  return {
    widthCm: roundCm(normalized.widthCm),
    heightCm: roundCm(normalized.heightCm),
    depthCm: roundCm(normalized.depthCm),
    wasUnitScaled,
    wasClamped,
    wasCategoryNormalized: normalized.wasCategoryNormalized
  }
}

export async function detectGlbDimensionsFromFile(
  file: File,
  category: UserItemCategory
): Promise<GlbDimensionResult> {
  const loader = getGltfLoader()
  const buffer = await file.arrayBuffer()
  const gltf = await loader.parseAsync(buffer, '')

  const box = new THREE.Box3().setFromObject(gltf.scene)
  const size = new THREE.Vector3()
  box.getSize(size)

  if (size.x <= 0 || size.y <= 0 || size.z <= 0) {
    throw new Error('Could not measure model dimensions')
  }

  return dimensionsFromRawSize(size, category)
}
