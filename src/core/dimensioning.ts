import { Configuration, configDimUnit } from './configuration'

/** Dimensioning in Inch. */
export const dimInch: string = 'inch'

/** Dimensioning in Meter. */
export const dimMeter: string = 'm'

/** Dimensioning in Centi Meter. */
export const dimCentiMeter: string = 'cm'

/** Dimensioning in Milli Meter. */
export const dimMilliMeter: string = 'mm'

/** Dimensioning functions. */
export class Dimensioning {
  /**
   * Parses typed dimension input to centimeters.
   * Supports ft/in (e.g. 7'4", 12'0", 7'),
   * explicit suffixes (m, cm, mm, ft, in), or a bare number in the current display unit.
   */
  public static parseUserInputToCm(raw: string): number | null {
    const s = raw.trim().replace(/,/g, '.')
    if (!s) return null

    const ftInMatch = s.match(/^(\d+)\s*['′]\s*(\d+(?:\.\d+)?)\s*["″']?\s*$/i)
    if (ftInMatch) {
      const ft = Number.parseInt(ftInMatch[1], 10)
      const inch = Number.parseFloat(ftInMatch[2])
      if (!Number.isFinite(ft) || !Number.isFinite(inch)) return null
      return (ft * 12 + inch) * 2.54
    }

    const ftOnlyMatch = s.match(/^(\d+)\s*['′]\s*$/i)
    if (ftOnlyMatch) {
      const ft = Number.parseInt(ftOnlyMatch[1], 10)
      if (!Number.isFinite(ft)) return null
      return ft * 12 * 2.54
    }

    const explicit = s.match(/^([\d.]+)\s*(m|meter|meters|cm|mm|ft|foot|feet|in|inch|inches)\s*$/i)
    if (explicit) {
      const val = Number.parseFloat(explicit[1])
      const u = explicit[2].toLowerCase()
      if (!Number.isFinite(val)) return null
      if (u === 'm' || u.startsWith('meter')) return val * 100
      if (u === 'cm') return val
      if (u === 'mm') return val / 10
      if (u === 'ft' || u.startsWith('foot')) return val * 30.48
      if (u === 'in' || u.startsWith('inch')) return val * 2.54
    }

    const n = Number.parseFloat(s)
    if (!Number.isFinite(n)) return null
    const unit = Configuration.getStringValue(configDimUnit)
    switch (unit) {
      case dimInch:
        return n * 2.54
      case dimMilliMeter:
        return n / 10
      case dimCentiMeter:
        return n
      case dimMeter:
      default:
        return n * 100
    }
  }

  /** Converts cm to dimensioning string.
   * @param cm Centi meter value to be converted.
   * @returns String representation.
   */
  public static cmToMeasure(cm: number): string {
    switch (Configuration.getStringValue(configDimUnit)) {
      case dimInch:
        const totalInches = cm / 2.54
        let feet = Math.floor(totalInches / 12)
        let inches = Math.round(totalInches - feet * 12)
        if (inches === 12) {
          feet += 1
          inches = 0
        }
        return feet + "'" + inches + '"'
      case dimMilliMeter:
        return '' + Math.round(10 * cm) + ' mm'
      case dimCentiMeter:
        return '' + Math.round(10 * cm) / 10 + ' cm'
      case dimMeter:
      default:
        return '' + Math.round(10 * cm) / 1000 + ' m'
    }
  }
}
