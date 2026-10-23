// Page-curl model for a sheet of paper lying on a desk.
//
// Paper is (nearly) inextensible, so it can only bend into developable shapes —
// it rolls, it never bulges or wrinkles like cloth. We model a lifted corner the
// classic way: a straight fold line on the desk; everything behind it stays flat,
// everything past it wraps around a cylinder of radius R, and whatever goes past
// half a turn lies flipped on top. The map is an isometry: arc length along the
// paper is preserved exactly, so text never stretches.
//
// `s` is a point's distance past the fold line (measured flat, along the curl
// direction). curlPoint maps it to how far along the desk it ends up (`along`,
// from the fold line) and how high (`height`).

export interface CurlPoint {
  along: number
  height: number
}

export function curlPoint(s: number, R: number): CurlPoint {
  if (s <= 0) return { along: s, height: 0 }
  const half = Math.PI * R
  if (s <= half) {
    const t = s / R
    return { along: R * Math.sin(t), height: R * (1 - Math.cos(t)) }
  }
  return { along: -(s - half), height: 2 * R }
}

// how far a point at distance s past the fold has been pulled back toward the fold
export function pullOf(s: number, R: number): number {
  return s - curlPoint(s, R).along
}

function bisect(f: (x: number) => number, lo: number, hi: number, target: number): number {
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2
    if (f(mid) < target) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export interface Curl {
  s: number // grabbed point's distance past the fold line
  R: number // curl radius
}

/**
 * Find the curl that moves the grabbed point back by `pull` and lifts it to
 * about `lift`. `rMin` is the tightest radius the paper will bend to (its
 * stiffness); `sMax` keeps the fold line on the sheet so part of it stays down.
 */
export function solveCurl(pull: number, lift: number, rMin: number, sMax = Infinity): Curl {
  if (!(pull > 0)) return { s: 0, R: rMin }
  const H = Math.max(lift, 1e-4)
  let s: number, R: number
  // (θ - sinθ) / (1 - cosθ): pull/lift ratio of a point that went θ around the cylinder
  const ratio = (t: number) => (t - Math.sin(t)) / (1 - Math.cos(t))
  if (pull / H < Math.PI / 2) {
    const t = bisect(ratio, 1e-6, Math.PI, pull / H)
    R = H / (1 - Math.cos(t))
    s = R * t
  } else {
    R = H / 2
    s = (pull + Math.PI * R) / 2
  }
  if (R < rMin) {
    // paper is too stiff for that radius: keep the pull, accept a lower lift
    R = rMin
    s = bisect((x) => pullOf(x, R), 0, pull + Math.PI * R, pull)
  }
  return { s: Math.min(s, sMax), R }
}
