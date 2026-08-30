import crypto from 'crypto';

/**
 * RFC 2104: HMAC: Keyed-Hashing for Message Authentication
 * 
 * TODO(Prome): Implement HMAC-SHA256 from scratch.
 * - Must not use Node's `crypto` module (currently using it as a temporary placeholder).
 * - Must take a secret key and a message string.
 * - Must return a hex string.
 */
export function generateHMAC(key: string, message: string): string {
  // Temporary implementation using built-in crypto for demo purposes
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

export function verifyHMAC(key: string, message: string, expectedMac: string): boolean {
  // Temporary implementation using built-in crypto for demo purposes
  const computedMac = generateHMAC(key, message);
  return crypto.timingSafeEqual(Buffer.from(computedMac, 'hex'), Buffer.from(expectedMac, 'hex'));
}
