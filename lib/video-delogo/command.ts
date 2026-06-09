// Pure logic for the "video delogo command generator" tool.
// The tool never processes video — it only turns user-drawn rectangles
// (in real video pixel coordinates) into an ffmpeg `delogo` filter command.

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
}

// delogo interpolates a region from the ring of pixels just outside it, so the
// rectangle must keep a ≥1px border to every edge. Clamp into [1, dim-1] and
// round to integers (ffmpeg wants integer coordinates).
export function clampRegion(r: Region, videoW: number, videoH: number): Region {
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

export function isValidRegion(r: Region): boolean {
  return r.w >= 1 && r.h >= 1
}

// True when clamping changed the rectangle, i.e. it touched/exceeded an edge.
export function wasClamped(r: Region, videoW: number, videoH: number): boolean {
  const c = clampRegion(r, videoW, videoH)
  return c.x !== Math.round(r.x) || c.y !== Math.round(r.y) || c.w !== Math.round(r.w) || c.h !== Math.round(r.h)
}

export function buildDelogoFilter(regions: Region[]): string {
  return regions
    .filter(isValidRegion)
    .map((r) => `delogo=x=${r.x}:y=${r.y}:w=${r.w}:h=${r.h}`)
    .join(',')
}

// Wrap a filename for the shell only when it contains characters that would
// otherwise break the command; escape embedded double quotes.
function quoteArg(name: string): string {
  if (name && !/[\s"'\\$`&|<>()*?;]/.test(name)) return name
  return `"${name.replace(/(["\\$`])/g, '\\$1')}"`
}

export function buildCommand(opts: BuildCommandOptions): string {
  const clamped = opts.regions
    .map((r) => clampRegion(r, opts.videoW, opts.videoH))
    .filter(isValidRegion)
  const filter = buildDelogoFilter(clamped)
  if (!filter) return ''
  return `ffmpeg -i ${quoteArg(opts.inputName)} -vf "${filter}" ${quoteArg(opts.outputName)}`
}

export function defaultOutputName(inputName: string): string {
  const slash = Math.max(inputName.lastIndexOf('/'), inputName.lastIndexOf('\\'))
  const dot = inputName.lastIndexOf('.')
  if (dot <= slash + 1) return `${inputName}_delogo`
  return `${inputName.slice(0, dot)}_delogo${inputName.slice(dot)}`
}
