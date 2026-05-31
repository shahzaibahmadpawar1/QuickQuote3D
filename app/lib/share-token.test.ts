import { describe, it, expect } from 'vitest'
import { buildShareUrl } from './share-token'

describe('buildShareUrl', () => {
  it('builds absolute URL when origin provided', () => {
    expect(buildShareUrl('abc123', 'https://example.com')).toBe('https://example.com/share/abc123')
  })

  it('returns relative path when no origin', () => {
    expect(buildShareUrl('abc123')).toBe('/share/abc123')
  })
})
