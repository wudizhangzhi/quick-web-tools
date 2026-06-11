// Pure logic for the video-delogo tool (supports two modes):
// - 'delogo': remove watermarks/logos by interpolation (supports multiple regions, chained delogo filters)
// - 'crop': extract only the selected rectangular region (single region, changes output resolution)
// The tool never processes video — it only generates the corresponding ffmpeg command.

export type ToolMode = 'delogo' | 'crop'

export interface Region {
  x: number
  y: number
  w: number
  h: number
}

export interface BuildCommandOptions {
  inputName: string
  outputName: string
  regions: Region[]
  videoW: number
  videoH: number
  mode?: ToolMode
  /** When true, emit a minimal command that lets ffmpeg use its default (lower) quality settings. Default false: emit flags for high-quality re-encode. */
  reduceQuality?: boolean
}

// delogo needs ≥1px border on all sides for interpolation from surrounding pixels.
// Clamp into [1, dim-1] and round to int.
function clampDelogoRegion(r: Region, videoW: number, videoH: number): Region {
  let x = Math.round(r.x)
  let y = Math.round(r.y)
  let w = Math.round(r.w)
  let h = Math.round(r.h)

  x = Math.min(Math.max(1, x), Math.max(1, videoW - 2))
  y = Math.min(Math.max(1, y), Math.max(1, videoH - 2))
  w = Math.max(0, w)
  h = Math.max(0, h)

  if (x + w > videoW - 1) w = videoW - 1 - x
  if (y + h > videoH - 1) h = videoH - 1 - y

  return { x, y, w, h }
}

// crop allows touching edges (0 or full dim). Just round + contain.
function clampCropRegion(r: Region, videoW: number, videoH: number): Region {
  let x = Math.round(r.x)
  let y = Math.round(r.y)
  let w = Math.round(r.w)
  let h = Math.round(r.h)

  x = Math.max(0, Math.min(x, videoW))
  y = Math.max(0, Math.min(y, videoH))
  w = Math.max(0, w)
  h = Math.max(0, h)

  if (x + w > videoW) w = videoW - x
  if (y + h > videoH) h = videoH - y

  return { x, y, w, h }
}

export function clampRegion(r: Region, videoW: number, videoH: number, mode: ToolMode = 'delogo'): Region {
  return mode === 'crop' ? clampCropRegion(r, videoW, videoH) : clampDelogoRegion(r, videoW, videoH)
}

export function isValidRegion(r: Region): boolean {
  return r.w >= 1 && r.h >= 1
}

// True when clamping changed the rectangle.
export function wasClamped(r: Region, videoW: number, videoH: number, mode: ToolMode = 'delogo'): boolean {
  const c = clampRegion(r, videoW, videoH, mode)
  return c.x !== Math.round(r.x) || c.y !== Math.round(r.y) || c.w !== Math.round(r.w) || c.h !== Math.round(r.h)
}

export function buildDelogoFilter(regions: Region[]): string {
  return regions
    .filter(isValidRegion)
    .map((r) => `delogo=x=${r.x}:y=${r.y}:w=${r.w}:h=${r.h}`)
    .join(',')
}

export function buildCropFilter(regions: Region[]): string {
  const first = regions.filter(isValidRegion)[0]
  if (!first) return ''
  const r = first
  return `crop=${r.w}:${r.h}:${r.x}:${r.y}`
}

// Wrap a filename for the shell only when it contains characters that would
// otherwise break the command; escape embedded double quotes.
function quoteArg(name: string): string {
  if (name && !/[\s"'\\$`&|<>()*?;]/.test(name)) return name
  return `"${name.replace(/(["\\$`])/g, '\\$1')}"`
}

export function buildCommand(opts: BuildCommandOptions): string {
  const mode: ToolMode = opts.mode || 'delogo'
  const clamped = opts.regions
    .map((r) => clampRegion(r, opts.videoW, opts.videoH, mode))
    .filter(isValidRegion)

  const filter = mode === 'crop'
    ? buildCropFilter(clamped)
    : buildDelogoFilter(clamped)

  if (!filter) return ''

  const base = `ffmpeg -i ${quoteArg(opts.inputName)} -vf "${filter}"`
  if (opts.reduceQuality) {
    return `${base} ${quoteArg(opts.outputName)}`
  }
  // High quality re-encode for both modes (vf filter requires video re-encode anyway).
  return `${base} -c:v libx264 -crf 18 -preset slow -c:a copy ${quoteArg(opts.outputName)}`
}

export function defaultOutputName(inputName: string, mode: ToolMode = 'delogo'): string {
  const suffix = mode === 'crop' ? '_crop' : '_delogo'
  const slash = Math.max(inputName.lastIndexOf('/'), inputName.lastIndexOf('\\'))
  const dot = inputName.lastIndexOf('.')
  if (dot <= slash + 1) return `${inputName}${suffix}`
  return `${inputName.slice(0, dot)}${suffix}${inputName.slice(dot)}`
}
