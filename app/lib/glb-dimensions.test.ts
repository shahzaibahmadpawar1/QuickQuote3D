import { describe, it, expect } from 'vitest'
import {
  dimensionsFromRawSize,
  getUnitScaleFactorFromMaxDim,
  normalizeDimensionsByCategory,
  pickAnchorValue
} from './glb-dimensions'
import * as THREE from 'three'

describe('getUnitScaleFactorFromMaxDim', () => {
  it('treats small values as meters', () => {
    expect(getUnitScaleFactorFromMaxDim(1.5)).toBe(100)
  })
  it('treats mid values as centimeters', () => {
    expect(getUnitScaleFactorFromMaxDim(120)).toBe(1)
  })
  it('treats large values as millimeters', () => {
    expect(getUnitScaleFactorFromMaxDim(1200)).toBe(0.1)
  })
})

describe('normalizeDimensionsByCategory', () => {
  it('scales a tiny chair uniformly to target height', () => {
    const result = normalizeDimensionsByCategory(30, 20, 30, 'chair')
    expect(result.wasCategoryNormalized).toBe(true)
    expect(result.heightCm).toBeCloseTo(85, 0)
    expect(result.widthCm / result.heightCm).toBeCloseTo(30 / 20, 2)
  })

  it('leaves in-range table dimensions unchanged', () => {
    const result = normalizeDimensionsByCategory(120, 75, 60, 'table')
    expect(result.wasCategoryNormalized).toBe(false)
    expect(result.heightCm).toBe(75)
  })
})

describe('dimensionsFromRawSize', () => {
  it('converts meter-sized bbox to cm and normalizes chair', () => {
    const size = new THREE.Vector3(0.5, 0.85, 0.5)
    const result = dimensionsFromRawSize(size, 'chair')
    expect(result.widthCm).toBeGreaterThan(40)
    expect(result.heightCm).toBeGreaterThan(40)
    expect(result.wasUnitScaled).toBe(true)
  })
})

describe('pickAnchorValue', () => {
  it('uses longest horizontal for beds', () => {
    expect(pickAnchorValue(200, 50, 90, 'longestHorizontal')).toBe(200)
  })
})
