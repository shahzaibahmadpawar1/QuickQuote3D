/**
 * Shared animation state for the "Furniture placement" section (Step 03).
 *
 * A GSAP timeline (built in `FurnitureSection`, DOM side) tweens these fields
 * with `scrub: true`, and `FurnitureScene` + `CameraRig` (canvas side) read
 * them every frame. Same module-singleton bridge as the lift section.
 */

export const FURNITURE_COUNT = 5

export interface FurnitureState {
  /** Slow camera orbit around the room (0 → 1 → a few degrees). */
  orbit: number
  /** Per-item placement (0 → ~1, eased with back.out for the landing bounce). */
  items: number[]
  /** Per-item "placed" confirmation ring pulse (0 → 1 → 0 as it lands). */
  ring: number[]
  /** Per-item price-chip fade (0 → 1 after the item lands). */
  chip: number[]
}

export const furnitureState: FurnitureState = {
  orbit: 0,
  items: new Array(FURNITURE_COUNT).fill(0),
  ring: new Array(FURNITURE_COUNT).fill(0),
  chip: new Array(FURNITURE_COUNT).fill(0)
}

export function resetFurnitureState() {
  furnitureState.orbit = 0
  furnitureState.items.fill(0)
  furnitureState.ring.fill(0)
  furnitureState.chip.fill(0)
}
