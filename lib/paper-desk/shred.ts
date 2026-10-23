// Where a point of a shredded strip ends up.
//
// The sheet is fed (moved toward -z) into a shredder whose cutting line sits at the
// sheet's top edge. `d` is how far a point has travelled past the cutting line.
// Before the cut it is still flat paper; inside the machine it is hidden; once it
// leaves the far side it piles up in front of the outlet as a crumpled ribbon —
// the extra length goes into accordion folds instead of running off forever.

export const SHRED_DEPTH = 0.45 // shredder body depth (cut line → outlet), world units
export const PILE_REACH = 1.0 // how far strips spread beyond the outlet at most

export interface StripParams {
  phase: number // crumple phase, radians
  freq: number // crumple frequency
  sway: number // sideways wiggle phase
  spread: number // signed sideways drift of this strip, world units
}

export interface ShredOffset {
  dz: number // position along -z relative to the cut line (negative = past it)
  dx: number // sideways offset
  y: number // height above the desk
  hidden: boolean // inside the machine
}

export function shredPoint(d: number, p: StripParams, lift = 0.003): ShredOffset {
  if (d <= 0) return { dz: -d, dx: 0, y: lift, hidden: false }
  if (d <= SHRED_DEPTH) return { dz: -d, dx: 0, y: lift, hidden: true }
  const o = d - SHRED_DEPTH
  const ramp = Math.min(1, o * 3)
  const along = PILE_REACH * (1 - Math.exp(-o / PILE_REACH))
  const crumple = 0.09 * ramp * Math.abs(Math.sin(o * p.freq + p.phase))
  const heap = 0.05 * Math.min(1, o / 2)
  return {
    dz: -(SHRED_DEPTH + along),
    dx: p.spread * Math.min(1, o) + Math.sin(o * 4.3 + p.sway) * 0.06 * ramp,
    y: lift + crumple + heap,
    hidden: false,
  }
}

export function stripParams(k: number, count: number, rand: () => number): StripParams {
  const center = (k + 0.5) / count - 0.5 // -0.5 … 0.5 across the sheet
  return {
    phase: rand() * Math.PI * 2,
    freq: 5 + rand() * 4,
    sway: rand() * Math.PI * 2,
    spread: center * 0.35 + (rand() - 0.5) * 0.08,
  }
}
