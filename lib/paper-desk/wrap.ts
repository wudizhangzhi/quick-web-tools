// Line wrapping for canvas text that mixes CJK and Latin.
// CJK characters may break anywhere; Latin runs break only at spaces (a single
// word longer than the line is hard-split). Explicit `\n` always breaks, and
// blank lines are kept so paragraphs survive.

export type Measure = (s: string) => number

const CJK = /[⺀-鿿豈-﫿＀-￯　-〿]/
// punctuation that must not start a line (kinsoku): hang it on the previous line
const NO_START = /^[，。、！？；：）》」』】,.!?;:)\]}]/

// split a paragraph into breakable tokens: each CJK char, each Latin word, each space run
export function tokenize(s: string): string[] {
  const out: string[] = []
  let buf = ''
  for (const ch of s) {
    if (CJK.test(ch)) {
      if (buf) out.push(buf), (buf = '')
      out.push(ch)
    } else if (ch === ' ') {
      if (buf && !buf.endsWith(' ')) out.push(buf), (buf = '')
      buf += ch
    } else {
      if (buf.endsWith(' ')) out.push(buf), (buf = '')
      buf += ch
    }
  }
  if (buf) out.push(buf)
  return out
}

function hardSplit(word: string, maxWidth: number, measure: Measure): string[] {
  const parts: string[] = []
  let cur = ''
  for (const ch of word) {
    if (cur && measure(cur + ch) > maxWidth) parts.push(cur), (cur = '')
    cur += ch
  }
  if (cur) parts.push(cur)
  return parts
}

export function wrapParagraph(p: string, maxWidth: number, measure: Measure): string[] {
  if (p === '') return ['']
  const lines: string[] = []
  let cur = ''
  for (const tok of tokenize(p)) {
    const next = cur + tok
    if (measure(next) <= maxWidth || cur === '') {
      if (cur === '' && measure(tok) > maxWidth && tok.trim()) {
        const parts = hardSplit(tok, maxWidth, measure)
        lines.push(...parts.slice(0, -1))
        cur = parts[parts.length - 1]
      } else {
        cur = next
      }
      continue
    }
    if (tok.trim() === '') continue // swallow the space at a break
    if (NO_START.test(tok)) {
      cur += tok // let closing punctuation hang slightly past the margin
      continue
    }
    lines.push(cur.trimEnd())
    if (measure(tok) > maxWidth) {
      const parts = hardSplit(tok, maxWidth, measure)
      lines.push(...parts.slice(0, -1))
      cur = parts[parts.length - 1]
    } else {
      cur = tok
    }
  }
  lines.push(cur.trimEnd())
  return lines
}

export function wrapText(text: string, maxWidth: number, measure: Measure): string[] {
  return text.replace(/\r\n?/g, '\n').split('\n').flatMap((p) => wrapParagraph(p, maxWidth, measure))
}
