import { describe, it, expect } from 'vitest'
import {
  clampRegion,
  isValidRegion,
  wasClamped,
  buildDelogoFilter,
  buildCommand,
  defaultOutputName,
} from './command'

describe('clampRegion', () => {
  it('rounds coordinates to integers', () => {
    expect(clampRegion({ x: 10.6, y: 20.2, w: 30.5, h: 40.4 }, 1920, 1080)).toEqual({
      x: 11,
      y: 20,
      w: 31,
      h: 40,
    })
  })

  it('keeps at least a 1px border from the top-left edge', () => {
    expect(clampRegion({ x: 0, y: 0, w: 100, h: 50 }, 1920, 1080)).toEqual({
      x: 1,
      y: 1,
      w: 100,
      h: 50,
    })
  })

  it('shrinks a region that runs past the right/bottom edge', () => {
    // x=1900 + w=100 would reach 2000 > 1920-1; clamp w to 1919-1900 = 19
    expect(clampRegion({ x: 1900, y: 1050, w: 100, h: 100 }, 1920, 1080)).toEqual({
      x: 1900,
      y: 1050,
      w: 19,
      h: 29,
    })
  })
})

describe('wasClamped', () => {
  it('is false for a region safely inside the frame', () => {
    expect(wasClamped({ x: 10, y: 10, w: 50, h: 50 }, 1920, 1080)).toBe(false)
  })
  it('is true for a region touching an edge', () => {
    expect(wasClamped({ x: 0, y: 10, w: 50, h: 50 }, 1920, 1080)).toBe(true)
  })
})

describe('isValidRegion', () => {
  it('rejects zero/negative sized regions', () => {
    expect(isValidRegion({ x: 1, y: 1, w: 0, h: 50 })).toBe(false)
    expect(isValidRegion({ x: 1, y: 1, w: 50, h: 0 })).toBe(false)
    expect(isValidRegion({ x: 1, y: 1, w: 50, h: 50 })).toBe(true)
  })
})

describe('buildDelogoFilter', () => {
  it('builds a single delogo filter', () => {
    expect(buildDelogoFilter([{ x: 10, y: 10, w: 120, h: 60 }])).toBe(
      'delogo=x=10:y=10:w=120:h=60',
    )
  })

  it('chains multiple regions with commas', () => {
    expect(
      buildDelogoFilter([
        { x: 10, y: 10, w: 120, h: 60 },
        { x: 800, y: 600, w: 90, h: 40 },
      ]),
    ).toBe('delogo=x=10:y=10:w=120:h=60,delogo=x=800:y=600:w=90:h=40')
  })

  it('drops invalid regions', () => {
    expect(
      buildDelogoFilter([
        { x: 10, y: 10, w: 0, h: 60 },
        { x: 800, y: 600, w: 90, h: 40 },
      ]),
    ).toBe('delogo=x=800:y=600:w=90:h=40')
  })
})

describe('buildCommand', () => {
  const base = { inputName: 'input.mp4', outputName: 'out.mp4', videoW: 1920, videoH: 1080 }

  it('builds a full ffmpeg command, clamping regions', () => {
    expect(
      buildCommand({ ...base, regions: [{ x: 0, y: 0, w: 120, h: 60 }] }),
    ).toBe('ffmpeg -i input.mp4 -vf "delogo=x=1:y=1:w=120:h=60" out.mp4')
  })

  it('returns empty string when no valid regions remain', () => {
    expect(buildCommand({ ...base, regions: [] })).toBe('')
    expect(buildCommand({ ...base, regions: [{ x: 1, y: 1, w: 0, h: 0 }] })).toBe('')
  })

  it('quotes filenames that contain spaces or special chars', () => {
    expect(
      buildCommand({
        inputName: 'my clip.mp4',
        outputName: 'my clip_delogo.mp4',
        videoW: 1920,
        videoH: 1080,
        regions: [{ x: 10, y: 10, w: 50, h: 50 }],
      }),
    ).toBe('ffmpeg -i "my clip.mp4" -vf "delogo=x=10:y=10:w=50:h=50" "my clip_delogo.mp4"')
  })
})

describe('defaultOutputName', () => {
  it('inserts _delogo before the extension', () => {
    expect(defaultOutputName('video.mp4')).toBe('video_delogo.mp4')
  })
  it('appends _delogo when there is no extension', () => {
    expect(defaultOutputName('video')).toBe('video_delogo')
  })
  it('handles dotfiles without a real extension', () => {
    expect(defaultOutputName('.gitignore')).toBe('.gitignore_delogo')
  })
})
