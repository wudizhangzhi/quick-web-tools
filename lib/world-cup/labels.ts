import type { Match, Stage } from './types'

export function stageLabel(stage: Stage): string {
  switch (stage) {
    case 'group':
      return '小组赛'
    case 'r32':
      return '32 强'
    case 'r16':
      return '16 强'
    case 'qf':
      return '8 强'
    case 'sf':
      return '4 强'
    case 'third':
      return '季军战'
    case 'final':
      return '决赛'
  }
}

// Short label for a match's place in the tournament, e.g. "小组赛 A 组" / "8 强".
export function matchLabel(match: Match): string {
  if (match.stage === 'group') return `小组赛 ${match.group ?? ''} 组`.trim()
  return stageLabel(match.stage)
}

// Format kickoff for display in Beijing time (UTC+8), e.g. "6月11日 03:00".
export function kickoffLabel(iso: string): string {
  const d = new Date(iso)
  const bj = new Date(d.getTime() + 8 * 60 * 60 * 1000)
  const mo = bj.getUTCMonth() + 1
  const day = bj.getUTCDate()
  const hh = String(bj.getUTCHours()).padStart(2, '0')
  const mm = String(bj.getUTCMinutes()).padStart(2, '0')
  return `${mo}月${day}日 ${hh}:${mm}`
}
