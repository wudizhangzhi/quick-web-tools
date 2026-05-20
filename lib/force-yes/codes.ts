import { customAlphabet } from 'nanoid'
import { SHORT_CODE_LENGTH } from './constants'

const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const generate = customAlphabet(alphabet, SHORT_CODE_LENGTH)
const generateOwner = customAlphabet(alphabet, 24)
const SHORT_CODE_RE = new RegExp(`^[a-zA-Z0-9]{${SHORT_CODE_LENGTH}}$`)

export function generateShortCode(): string {
  return generate()
}

export function isValidShortCode(s: string): boolean {
  return SHORT_CODE_RE.test(s)
}

export function generateOwnerId(): string {
  return generateOwner()
}
