/**
 * Shared animation state for the "2D → 3D lift" section.
 *
 * A GSAP timeline (built in `LiftSection`, DOM side) tweens these fields with
 * `scrub: true`, and `LiftScene` + `CameraRig` (canvas side) read them every
 * frame. Using a module-level singleton lets the DOM timeline and the R3F
 * scene share the same mutable state without crossing the Canvas React
 * boundary. There is only ever one immersive landing mounted at a time.
 */

export const LIFT_WALL_COUNT = 6

export interface LiftState {
  /** 0 = top-down (continues the floor plan), 1 = ~35° perspective. */
  camTilt: number
  /** Per-wall extrusion height factor (0 → 1), staggered by the timeline. */
  wall: number[]
  /** Directional light + contact-shadow reveal (0 → 1). */
  light: number
  /** Floor material reveal (0 → 1). */
  floor: number
  /** Window glass reveal (0 → 1). */
  glass: number
}

export const liftState: LiftState = {
  camTilt: 0,
  wall: new Array(LIFT_WALL_COUNT).fill(0),
  light: 0,
  floor: 0,
  glass: 0
}

export function resetLiftState() {
  liftState.camTilt = 0
  liftState.wall.fill(0)
  liftState.light = 0
  liftState.floor = 0
  liftState.glass = 0
}
