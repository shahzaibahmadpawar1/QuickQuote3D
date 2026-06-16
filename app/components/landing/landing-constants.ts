export const LANDING_MODELS = {
  interior: '/models/landing/interior.glb',
  house: '/models/landing/houseModel.glb'
} as const

export const SCROLL_PAGES = 6

export const MODEL_CROSSFADE = {
  start: 0.51,
  end: 0.59
} as const

/** Orbit pivot — vertical center of bottom-aligned models in the left viewport. */
export const STAGE_PIVOT: [number, number, number] = [-0.28, 0.52, 0]

/** World position for the model group (raised so the model sits mid-left on screen). */
export const STAGE_OFFSET: [number, number, number] = [STAGE_PIVOT[0], 0.38, STAGE_PIVOT[2]]

/** Fixed orbit radius — min/max distance are equal so zoom is disabled. */
export const ORBIT_DISTANCE = 3.75

/** Initial camera position (isometric view of the left-stage pivot). */
export const INITIAL_CAMERA: [number, number, number] = [0.9, 1.55, 3.4]

/** Subtle scroll-driven camera keyframes — small shifts so the scene feels alive while scrolling. */
export const CAMERA_KEYFRAMES = [
  { position: [0.9, 1.55, 3.4] as const, target: STAGE_PIVOT },
  { position: [1.15, 1.62, 3.15] as const, target: STAGE_PIVOT },
  { position: [0.65, 1.48, 3.5] as const, target: STAGE_PIVOT },
  { position: [1.0, 1.58, 3.25] as const, target: STAGE_PIVOT },
  { position: [1.0, 1.58, 3.25] as const, target: STAGE_PIVOT },
  { position: [1.2, 1.65, 3.0] as const, target: STAGE_PIVOT }
] as const

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export function sampleCameraKeyframe(scrollOffset: number) {
  const segments = CAMERA_KEYFRAMES.length - 1
  const scaled = scrollOffset * segments
  const index = Math.min(Math.floor(scaled), segments - 1)
  const fraction = scaled - index
  const from = CAMERA_KEYFRAMES[index]
  const to = CAMERA_KEYFRAMES[index + 1]

  return {
    position: from.position.map((v, i) => v + (to.position[i] - v) * fraction) as [number, number, number],
    target: from.target.map((v, i) => v + (to.target[i] - v) * fraction) as [number, number, number]
  }
}
