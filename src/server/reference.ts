import { randomBytes } from "node:crypto";

/**
 * Generates a short, human-quotable booking reference such as `BMP-7KQ2F4`.
 *
 * The alphabet omits characters that are easily confused when read aloud or
 * copied from an email (0/O, 1/I/L).
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateReference(prefix = "BMP", length = 6): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `${prefix}-${out}`;
}
