import { describe, it, expect } from 'vitest'
import { DEFAULT_CONFIG, LIMITS, sanitizeConfig, formatDate, isBlank } from './config'

describe('sanitizeConfig', () => {
  it('returns defaults for garbage input', () => {
    expect(sanitizeConfig(null)).toEqual(DEFAULT_CONFIG)
    expect(sanitizeConfig('nope')).toEqual(DEFAULT_CONFIG)
  })

  it('defaults to the date-application letter', () => {
    expect(DEFAULT_CONFIG.title).toBe('约会申请书')
    expect(DEFAULT_CONFIG.signature).toContain('老公')
    expect(DEFAULT_CONFIG.stamp).toBe(true)
  })

  it('keeps valid fields and falls back on unknown enum values', () => {
    const c = sanitizeConfig({ title: 'hi', style: 'grid', titleStyle: { font: 'comic-sans', color: '#ABCDEF' } })
    expect(c.title).toBe('hi')
    expect(c.style).toBe('grid')
    expect(c.titleStyle.font).toBe(DEFAULT_CONFIG.titleStyle.font)
    expect(c.titleStyle.color).toBe('#abcdef')
  })

  it('rejects colours that are not #rrggbb (no CSS injection into canvas)', () => {
    for (const color of ['red', '#fff', 'url(x)', '#12345g', 'rgb(0,0,0)']) {
      expect(sanitizeConfig({ bodyStyle: { font: 'serif', color } }).bodyStyle).toEqual({
        font: 'serif',
        color: DEFAULT_CONFIG.bodyStyle.color,
      })
    }
  })

  it('rejects prototype keys as enum values', () => {
    expect(sanitizeConfig({ style: 'toString' }).style).toBe(DEFAULT_CONFIG.style)
  })

  it('truncates long text and clamps fontScale', () => {
    const c = sanitizeConfig({ body: 'x'.repeat(5000), fontScale: 9 })
    expect(c.body.length).toBe(LIMITS.body)
    expect(c.fontScale).toBe(1.4)
    expect(sanitizeConfig({ fontScale: NaN }).fontScale).toBe(DEFAULT_CONFIG.fontScale)
  })

  it('falls back to the default stamp text when blank, and caps its length', () => {
    expect(sanitizeConfig({ stampText: '   ' }).stampText).toBe(DEFAULT_CONFIG.stampText)
    expect(sanitizeConfig({ stampText: '准了准了准了准了' }).stampText.length).toBe(LIMITS.stampText)
    expect(sanitizeConfig({ stamp: false }).stamp).toBe(false)
    expect(sanitizeConfig({ stamp: 'yes' }).stamp).toBe(true)
  })
})

describe('isBlank', () => {
  it('is true only when there is nothing to read', () => {
    expect(isBlank({ ...DEFAULT_CONFIG, title: ' ', body: '\n', signature: '' })).toBe(true)
    expect(isBlank(DEFAULT_CONFIG)).toBe(false)
  })
})

describe('formatDate', () => {
  it('formats as a Chinese date', () => {
    expect(formatDate(new Date(2026, 9, 23))).toBe('2026 年 10 月 23 日')
  })
})
