/** Decorative wall paint swatches (no pricing impact). */
export const WALL_COLOR_PRESETS = [
  { id: 'white', hex: '#FFFFFF', label: 'White' },
  { id: 'cream', hex: '#F5F0E6', label: 'Cream' },
  { id: 'sand', hex: '#D4C4A8', label: 'Sand' },
  { id: 'terracotta', hex: '#C86B4A', label: 'Terracotta' },
  { id: 'coral', hex: '#E8927C', label: 'Coral' },
  { id: 'sky', hex: '#A8C8D8', label: 'Sky blue' },
  { id: 'slate', hex: '#5A6B7A', label: 'Slate' },
  { id: 'sage', hex: '#8FA88B', label: 'Sage' },
  { id: 'charcoal', hex: '#3D4543', label: 'Charcoal' },
  { id: 'walnut', hex: '#6B5344', label: 'Walnut' },
  { id: 'lavender', hex: '#9B8AA5', label: 'Lavender' },
  { id: 'mustard', hex: '#C4A035', label: 'Mustard' }
] as const

export function normalizeWallColor(hex: string): string {
  return hex.trim().toUpperCase()
}
