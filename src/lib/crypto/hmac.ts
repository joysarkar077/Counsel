import { createHash, timingSafeEqual } from 'crypto';

const BLOCK_SIZE = 64; // 64 bytes (512 bits) block size for SHA-256
const IPAD_BYTE = 0x36;
const OPAD_BYTE = 0x5c;

/**
 * Computes HMAC-SHA256 per RFC 2104 from scratch without crypto.createHmac.
 *
 * HMAC(K, m) = H((K' ^ opad) || H((K' ^ ipad) || m))
 * where:
 * - H is SHA-256 (via crypto.createHash('sha256'))
 * - K' is the key formatted to BLOCK_SIZE (64 bytes):
 *   - if len(K) > 64: K' = H(K) zero-padded to 64 bytes
 *   - if len(K) < 64: K' = K zero-padded to 64 bytes
 * - ipad is byte 0x36 repeated 64 times
 * - opad is byte 0x5c repeated 64 times
 *
 * @param key - The secret cryptographic key
 * @param message - The message data to authenticate
 * @returns The resulting 32-byte HMAC tag as a Buffer
 */
export function hmacSha256(key: Buffer, message: Buffer): Buffer {
  let normalizedKey: Buffer;

  if (key.length > BLOCK_SIZE) {
    normalizedKey = createHash('sha256').update(key).digest();
  } else {
    normalizedKey = key;
  }

  const paddedKey = Buffer.alloc(BLOCK_SIZE, 0);
  normalizedKey.copy(paddedKey, 0);

  const kIpad = Buffer.alloc(BLOCK_SIZE);
  const kOpad = Buffer.alloc(BLOCK_SIZE);

  for (let i = 0; i < BLOCK_SIZE; i++) {
    kIpad[i] = paddedKey[i] ^ IPAD_BYTE;
    kOpad[i] = paddedKey[i] ^ OPAD_BYTE;
  }

  const innerHash = createHash('sha256').update(kIpad).update(message).digest();
  const outerHash = createHash('sha256').update(kOpad).update(innerHash).digest();

  return outerHash;
}

/**
 * Convenience helper: computes HMAC-SHA256 for string inputs and returns a hex string.
 */
export function generateHMAC(key: string, message: string): string {
  return hmacSha256(Buffer.from(key, 'utf-8'), Buffer.from(message, 'utf-8')).toString('hex');
}

/**
 * Constant-time verification of HMAC-SHA256 hex strings.
 */
export function verifyHMAC(key: string, message: string, expectedMac: string): boolean {
  const computedMac = generateHMAC(key, message);
  const bufA = Buffer.from(computedMac, 'hex');
  const bufB = Buffer.from(expectedMac, 'hex');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
