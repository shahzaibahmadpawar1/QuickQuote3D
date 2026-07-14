import { BRAND } from '@/lib/brand-palette'

/**
 * Colour palette for the 3D scenes, keyed off the active (light/dark) theme.
 *
 * R3F does not bridge React context across the <Canvas> boundary, so Scene3D
 * reads the resolved next-themes value in the DOM tree and threads the matching
 * palette into every scene as a prop. Toggling the theme rebuilds the palette
 * and the scenes update their materials in place.
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
  /** Dimension lines. */
  dimLine: string
  /** Extruded 3D wall material colour (Lift section). */
  liftWall: string
  /** Vignette darkness for post-processing. */
  vignette: number
}

const DARK: ImmersivePalette = {
  isDark: true,
  fog: BRAND.darkNavy,
  ambient: 0.55,
  dirIntensity: 0.4,
  gridMinor: BRAND.indigo,
  gridMajor: BRAND.slate,
  wallStrong: BRAND.cream,
  wallSoft: BRAND.tan,
  dimLine: BRAND.brassDark,
  liftWall: BRAND.tan,
  vignette: 0.62
}

const LIGHT: ImmersivePalette = {
  isDark: false,
  fog: BRAND.cream,
  ambient: 0.9,
  dirIntensity: 0.6,
  gridMinor: BRAND.tan,
  gridMajor: BRAND.slate,
  wallStrong: BRAND.navy,
  wallSoft: BRAND.slate,
  dimLine: BRAND.cognac,
  liftWall: BRAND.tan,
  vignette: 0.3
}

export function getImmersivePalette(isDark: boolean): ImmersivePalette {
  return isDark ? DARK : LIGHT
}
