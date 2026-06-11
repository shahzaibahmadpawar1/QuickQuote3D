import {
  DEFAULT_WALL_OPACITY,
  type WallVisibilityMode
} from '@blueprint3d/three/wall-visibility'

const STORAGE_KEY = 'blueprint3d.wallVisibility'

export type WallVisibilityPrefs = {
  mode: WallVisibilityMode
  opacity: number
}

const DEFAULT_PREFS: WallVisibilityPrefs = {
  mode: 'solid',
  opacity: DEFAULT_WALL_OPACITY
}

function clampOpacity(value: number): number {
  return Math.min(0.9, Math.max(0.1, value))
}

export function loadWallVisibilityPrefs(): WallVisibilityPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw) as Partial<WallVisibilityPrefs>
    const mode = parsed.mode
    if (mode !== 'solid' && mode !== 'hidden' && mode !== 'translucent') {
      return DEFAULT_PREFS
    }
    const opacity =
      typeof parsed.opacity === 'number' && Number.isFinite(parsed.opacity)
        ? clampOpacity(parsed.opacity)
        : DEFAULT_WALL_OPACITY
    return { mode, opacity }
  } catch {
    return DEFAULT_PREFS
  }
}

export function saveWallVisibilityPrefs(prefs: WallVisibilityPrefs): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        mode: prefs.mode,
        opacity: clampOpacity(prefs.opacity)
      })
    )
  } catch {
    // ignore quota / private mode
  }
}
