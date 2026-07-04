/**
 * Colour palette for the 3D scenes, keyed off the active (light/dark) theme.
 *
 * R3F does not bridge React context across the <Canvas> boundary, so Scene3D
 * reads the resolved next-themes value in the DOM tree and threads the matching
 * palette into every scene as a prop. Toggling the theme rebuilds the palette
 * and the scenes update their materials in place.
 *
 * Only theme-dependent colours live here. Accent hues (violet / cyan / emerald)
 * and natural furniture/material colours read well on both backgrounds and stay
 * hard-coded in the scenes.
 */
export interface ImmersivePalette {
  isDark: boolean
  /** Scene fog colour — matches the page background so geometry fades cleanly. */
  fog: string
  ambient: number
  dirIntensity: number
  /** Graph-paper grid (Hero + Floorplan). */
  gridMinor: string
  gridMajor: string
  /** Bold outer walls / footprint lines (2D plan + lift hand-off). */
  wallStrong: string
  /** Interior partition lines. */
  wallSoft: string
  /** Cyan dimension lines. */
  dimLine: string
  /** Extruded 3D wall material colour (Lift section). */
  liftWall: string
  /** Vignette darkness for post-processing. */
  vignette: number
}

const DARK: ImmersivePalette = {
  isDark: true,
  fog: '#0a0a0f',
  ambient: 0.5,
  dirIntensity: 0.35,
  gridMinor: '#2a2e48',
  gridMajor: '#5b4b9e',
  wallStrong: '#eef0f6',
  wallSoft: '#c9cbe0',
  dimLine: '#67e8f9',
  liftWall: '#dcdde8',
  vignette: 0.62
}

const LIGHT: ImmersivePalette = {
  isDark: false,
  fog: '#eef1f6',
  ambient: 0.9,
  dirIntensity: 0.55,
  gridMinor: '#cdd0dd',
  gridMajor: '#b3aad6',
  wallStrong: '#3a3f57',
  wallSoft: '#6b7089',
  dimLine: '#0e9ab4',
  liftWall: '#c4c7d4',
  vignette: 0.3
}

export function getImmersivePalette(isDark: boolean): ImmersivePalette {
  return isDark ? DARK : LIGHT
}
