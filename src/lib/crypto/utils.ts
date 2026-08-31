/**
 * Shared byte/hex/base64 helpers + constant-time compare.
 */

/**
 * Constant-time comparison of two Buffers using XOR accumulation.
 *
 * Never short-circuits — always inspects every byte so that timing
 * cannot leak which byte position differs. This prevents timing
 * side-channel attacks on secret comparisons (hashes, tokens, HMACs).
 *
 * @param a - First buffer
 * @param b - Second buffer
 * @returns true if both buffers have identical length and content
 */
export function constantTimeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }

  return diff === 0;
}

/**
 * Converts a hex-encoded string to a Buffer.
 */
export function hexToBuffer(hex: string): Buffer {
  return Buffer.from(hex, 'hex');
}

/**
 * Converts a Buffer to a hex-encoded string.
 */
export function bufferToHex(buf: Buffer): string {
  return buf.toString('hex');
}

/**
 * Converts a base64-encoded string to a Buffer.
 */
export function base64ToBuffer(b64: string): Buffer {
  return Buffer.from(b64, 'base64');
}

/**
 * Converts a Buffer to a base64-encoded string.
 */
export function bufferToBase64(buf: Buffer): string {
  return buf.toString('base64');
}
