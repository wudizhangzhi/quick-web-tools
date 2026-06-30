import { describe, it, expect } from 'vitest'
import { formatOrderNo } from './order'

describe('formatOrderNo', () => {
  it('is deterministic for the same seed', () => {
    expect(formatOrderNo(12345)).toBe(formatOrderNo(12345))
  })

  it('starts with HB and pads to 14 digits', () => {
    const no = formatOrderNo(42)
    expect(no).toMatch(/^HB\d{14}$/)
    expect(no).toBe('HB00000000000042')
  })

  it('keeps the last 14 digits for huge seeds', () => {
    const no = formatOrderNo(1730000000000999)
    expect(no).toMatch(/^HB\d{14}$/)
  })

  it('handles negative / fractional seeds without NaN', () => {
    expect(formatOrderNo(-7.9)).toBe('HB00000000000007')
  })
})
