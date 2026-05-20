import { customAlphabet } from 'nanoid'
import { SHORT_CODE_LENGTH } from './constants'

const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const generate = customAlphabet(alphabet, SHORT_CODE_LENGTH)

export function generateShortCode(): string {
  return generate()
}

export function isValidShortCode(s: string): boolean {
  if (s.length !== SHORT_CODE_LENGTH) return false
  for (let i = 0; i < s.length; i++) {
    if (!alphabet.includes(s[i])) return false
  }
  return true
}

export function generateOwnerId(): string {
  return customAlphabet(alphabet, 24)()
}
