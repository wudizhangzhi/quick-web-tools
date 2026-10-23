import { describe, it, expect } from 'vitest'
import { tokenize, wrapParagraph, wrapText } from './wrap'

// monospace measure: every char is 1 unit wide
const m = (s: string) => [...s].length

describe('tokenize', () => {
  it('splits CJK per character and keeps Latin words whole', () => {
    expect(tokenize('你好 hello world')).toEqual(['你', '好', ' ', 'hello', ' ', 'world'])
  })

  it('keeps mixed runs like version numbers together', () => {
    expect(tokenize('K3.1版')).toEqual(['K3.1', '版'])
  })
})

describe('wrapParagraph', () => {
  it('breaks CJK at any character', () => {
    expect(wrapParagraph('一二三四五六七', 3, m)).toEqual(['一二三', '四五六', '七'])
  })

  it('breaks Latin only at spaces and drops the space at the break', () => {
    expect(wrapParagraph('keep going now', 10, m)).toEqual(['keep going', 'now'])
  })

  it('hard-splits a word longer than the line', () => {
    expect(wrapParagraph('abcdefgh', 3, m)).toEqual(['abc', 'def', 'gh'])
  })

  it('does not start a line with closing punctuation', () => {
    expect(wrapParagraph('一二三。四', 3, m)).toEqual(['一二三。', '四'])
  })

  it('returns one empty line for an empty paragraph', () => {
    expect(wrapParagraph('', 5, m)).toEqual([''])
  })
})

describe('wrapText', () => {
  it('honours explicit newlines and keeps blank lines', () => {
    expect(wrapText('甲乙\n\n丙', 5, m)).toEqual(['甲乙', '', '丙'])
  })

  it('normalises CRLF', () => {
    expect(wrapText('a\r\nb', 5, m)).toEqual(['a', 'b'])
  })
})
