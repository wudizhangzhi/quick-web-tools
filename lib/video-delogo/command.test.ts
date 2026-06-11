import { describe, it, expect } from 'vitest'
import {
  clampRegion,
  isValidRegion,
  wasClamped,
  buildDelogoFilter,
  buildCropFilter,
  buildCommand,
  defaultOutputName,
  type ToolMode,
} from './command'

describe('clampRegion (mode-aware)', () => {
  it('rounds coordinates to integers (default delogo mode)', () => {
    expect(clampRegion({ x: 10.6, y: 20.2, w: 30.5, h: 40.4 }, 1920, 1080)).toEqual({
      x: 11,
      y: 20,
      w: 31,
      h: 40,
    })
  })

  it('delogo mode keeps ≥1px border from edges', () => {
    expect(clampRegion({ x: 0, y: 0, w: 100, h: 50 }, 1920, 1080, 'delogo')).toEqual({
      x: 1,
      y: 1,
      w: 100,
      h: 50,
    })
    expect(clampRegion({ x: 1900, y: 1050, w: 100, h: 100 }, 1920, 1080, 'delogo')).toEqual({
      x: 1900,
      y: 1050,
      w: 19,
      h: 29,
    })
  })

  it('crop mode allows touching edges (0 or full)', () => {
    expect(clampRegion({ x: 0, y: 0, w: 100, h: 50 }, 1920, 1080, 'crop')).toEqual({
      x: 0,
      y: 0,
      w: 100,
      h: 50,
    })
    expect(clampRegion({ x: 1820, y: 1030, w: 100, h: 50 }, 1920, 1080, 'crop')).toEqual({
      x: 1820,
      y: 1030,
      w: 100,
      h: 50,
    })
    expect(clampRegion({ x: 1900, y: 1050, w: 100, h: 100 }, 1920, 1080, 'crop')).toEqual({
      x: 1900,
      y: 1050,
      w: 20,
      h: 30,
    })
  })

  it('clamps negative starts (crop mode)', () => {
    expect(clampRegion({ x: -10, y: -5, w: 50, h: 30 }, 1920, 1080, 'crop')).toEqual({
      x: 0,
      y: 0,
      w: 50,
      h: 30,
    })
  })
})

describe('wasClamped (mode-aware)', () => {
  it('delogo: true when touching edge (needs inset)', () => {
    expect(wasClamped({ x: 0, y: 10, w: 50, h: 50 }, 1920, 1080, 'delogo')).toBe(true)
    expect(wasClamped({ x: 10, y: 10, w: 50, h: 50 }, 1920, 1080, 'delogo')).toBe(false)
  })
  it('crop: touching 0 is exact, no clamp change', () => {
    expect(wasClamped({ x: 0, y: 10, w: 50, h: 50 }, 1920, 1080, 'crop')).toBe(false)
    expect(wasClamped({ x: -5, y: 10, w: 50, h: 50 }, 1920, 1080, 'crop')).toBe(true)
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

describe('buildCropFilter', () => {
  it('builds crop from first valid region only', () => {
    expect(buildCropFilter([{ x: 10, y: 10, w: 120, h: 60 }])).toBe('crop=120:60:10:10')
    expect(
      buildCropFilter([
        { x: 100, y: 50, w: 200, h: 100 },
        { x: 800, y: 600, w: 90, h: 40 },
      ]),
    ).toBe('crop=200:100:100:50')
  })

  it('returns empty for no/invalid', () => {
    expect(buildCropFilter([])).toBe('')
    expect(buildCropFilter([{ x: 10, y: 10, w: 0, h: 60 }])).toBe('')
  })
})

describe('buildCommand (mode-aware)', () => {
  const base = { inputName: 'input.mp4', outputName: 'out.mp4', videoW: 1920, videoH: 1080 }

  // delogo mode (default)
  it('delogo default: uses delogo filter + 1px inset clamp + high quality flags', () => {
    expect(
      buildCommand({ ...base, regions: [{ x: 0, y: 0, w: 120, h: 60 }] }),
    ).toBe('ffmpeg -i input.mp4 -vf "delogo=x=1:y=1:w=120:h=60" -c:v libx264 -crf 18 -preset slow -c:a copy out.mp4')
  })

  it('delogo chains multiple', () => {
    const cmd = buildCommand({
      ...base,
      regions: [
        { x: 10, y: 10, w: 120, h: 60 },
        { x: 800, y: 600, w: 90, h: 40 },
      ],
    })
    expect(cmd).toContain('delogo=x=10:y=10:w=120:h=60,delogo=x=800:y=600:w=90:h=40')
  })

  // crop mode
  it('crop mode: uses crop filter, allows edge, single region (first wins)', () => {
    expect(
      buildCommand({ ...base, mode: 'crop', regions: [{ x: 0, y: 0, w: 120, h: 60 }] }),
    ).toBe('ffmpeg -i input.mp4 -vf "crop=120:60:0:0" -c:v libx264 -crf 18 -preset slow -c:a copy out.mp4')

    const multi = buildCommand({
      ...base,
      mode: 'crop',
      regions: [
        { x: 200, y: 100, w: 400, h: 300 },
        { x: 0, y: 0, w: 100, h: 100 },
      ],
    })
    expect(multi).toContain('crop=400:300:200:100')
    expect(multi).not.toContain('crop=100:100')
  })

  it('reduceQuality works for both modes', () => {
    expect(
      buildCommand({ ...base, mode: 'delogo', regions: [{ x: 10, y: 10, w: 50, h: 50 }], reduceQuality: true }),
    ).toBe('ffmpeg -i input.mp4 -vf "delogo=x=10:y=10:w=50:h=50" out.mp4')

    expect(
      buildCommand({ ...base, mode: 'crop', regions: [{ x: 10, y: 10, w: 50, h: 50 }], reduceQuality: true }),
    ).toBe('ffmpeg -i input.mp4 -vf "crop=50:50:10:10" out.mp4')
  })

  it('empty when no valid regions (both modes)', () => {
    expect(buildCommand({ ...base, regions: [] })).toBe('')
    expect(buildCommand({ ...base, mode: 'crop', regions: [{ x: 1, y: 1, w: 0, h: 0 }] })).toBe('')
  })

  it('quotes special filenames', () => {
    expect(
      buildCommand({
        inputName: 'my clip.mp4',
        outputName: 'my clip_delogo.mp4',
        videoW: 1920,
        videoH: 1080,
        mode: 'delogo',
        regions: [{ x: 10, y: 10, w: 50, h: 50 }],
      }),
    ).toBe('ffmpeg -i "my clip.mp4" -vf "delogo=x=10:y=10:w=50:h=50" -c:v libx264 -crf 18 -preset slow -c:a copy "my clip_delogo.mp4"')
  })
})

describe('defaultOutputName (mode-aware)', () => {
  it('delogo (default) uses _delogo', () => {
    expect(defaultOutputName('video.mp4')).toBe('video_delogo.mp4')
    expect(defaultOutputName('video.mp4', 'delogo')).toBe('video_delogo.mp4')
  })
  it('crop uses _crop', () => {
    expect(defaultOutputName('video.mp4', 'crop')).toBe('video_crop.mp4')
  })
  it('no-ext and dotfile cases', () => {
    expect(defaultOutputName('video', 'crop')).toBe('video_crop')
    expect(defaultOutputName('.gitignore', 'delogo')).toBe('.gitignore_delogo')
  })
})
