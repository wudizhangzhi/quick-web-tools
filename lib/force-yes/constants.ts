export const SHORT_CODE_LENGTH = 8
export const CONFIG_TTL_SECONDS = 60 * 60 * 24 * 90 // 90 days
export const OWNER_COOKIE_NAME = 'force_yes_owner'

export const YES_TEXT_MAX = 40
export const NO_TEXT_MAX = 40
export const YES_EFFECT_TEXT_MAX = 80

export const YES_SCALE_STEP = 1.25
export const YES_SCALE_MAX = 2.5
export const NO_MEME_THRESHOLDS = [2, 5] as const // 1-2 → idx 0, 3-5 → idx 1, 6+ → idx 2
export const NO_FLEE_AFTER = 4
export const NO_FLEE_MARGIN = 0.08

export function pickNoMemeIndex(noCount: number): 0 | 1 | 2 {
  if (noCount <= NO_MEME_THRESHOLDS[0]) return 0
  if (noCount <= NO_MEME_THRESHOLDS[1]) return 1
  return 2
}

export function noCountBucket(noCount: number): '0-2' | '3-5' | '6+' {
  if (noCount <= 2) return '0-2'
  if (noCount <= 5) return '3-5'
  return '6+'
}
