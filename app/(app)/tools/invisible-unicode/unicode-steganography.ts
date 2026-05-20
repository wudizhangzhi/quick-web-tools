// Unicode characters used for steganographic encoding
const START_MARKER = "\u200B"; // Zero Width Space
const ZERO_BIT = "\u200C"; // Zero Width Non-Joiner
const ONE_BIT = "\u2063"; // Invisible Separator
const END_MARKER = "\u200D"; // Zero Width Joiner

const INVISIBLE_CHARS = new Set([START_MARKER, ZERO_BIT, ONE_BIT, END_MARKER]);

/**
 * Encode visible text into invisible Unicode characters.
 * Each character is converted to its 16-bit binary representation,
 * then mapped to ZERO_BIT / ONE_BIT sequences, wrapped with markers.
 */
export function encode(text: string): string {
  let result = START_MARKER;

  for (const char of text) {
    const code = char.charCodeAt(0);
    const binary = code.toString(2).padStart(16, "0");

    for (const bit of binary) {
      result += bit === "0" ? ZERO_BIT : ONE_BIT;
    }
  }

  result += END_MARKER;
  return result;
}

/**
 * Decode invisible Unicode characters back to visible text.
 * Extracts bit characters between START_MARKER and END_MARKER,
 * reads 16 bits per character, and converts back to text.
 */
export function decode(invisible: string): string {
  const startIdx = invisible.indexOf(START_MARKER);
  const endIdx = invisible.indexOf(END_MARKER);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return "";
  }

  const payload = invisible.slice(startIdx + 1, endIdx);
  let bits = "";

  for (const ch of payload) {
    if (ch === ZERO_BIT) {
      bits += "0";
    } else if (ch === ONE_BIT) {
      bits += "1";
    }
  }

  if (bits.length === 0 || bits.length % 16 !== 0) {
    return "";
  }

  let result = "";
  for (let i = 0; i < bits.length; i += 16) {
    const charCode = parseInt(bits.slice(i, i + 16), 2);
    result += String.fromCharCode(charCode);
  }

  return result;
}

/**
 * Detect invisible characters in a string.
 * Returns whether invisible chars are present, their count,
 * the hidden text they encode, and the clean text with them removed.
 */
export function detect(text: string): {
  hasInvisible: boolean;
  invisibleCount: number;
  hiddenText: string;
  cleanText: string;
} {
  let invisibleCount = 0;
  let cleanText = "";

  for (const ch of text) {
    if (INVISIBLE_CHARS.has(ch)) {
      invisibleCount++;
    } else {
      cleanText += ch;
    }
  }

  const hiddenText = decode(text);

  return {
    hasInvisible: invisibleCount > 0,
    invisibleCount,
    hiddenText,
    cleanText,
  };
}

/**
 * Embed hidden text inside a visible carrier string.
 * The encoded payload is inserted after the first character of the carrier.
 */
export function embed(carrier: string, secret: string): string {
  if (carrier.length === 0) {
    return encode(secret);
  }

  const encoded = encode(secret);
  return carrier[0] + encoded + carrier.slice(1);
}
