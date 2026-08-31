/**
 * hmacStub.ts — Stub implementation of HMAC for tamper-detection fingerprinting.
 *
 * This module will be replaced by Person C's full HMAC implementation (hmac.ts)
 * once it is complete. The stub uses Node's built-in crypto solely as a
 * placeholder so the Cases API can compile and run end-to-end during development.
 *
 * TODO(PersonC): replace this stub with the real hmac.ts once implemented.
 * Integration point: computeHmac() and verifyHmac() signatures must stay stable.
 */

import crypto from 'crypto';

const SERVER_SECRET = process.env.SERVER_SECRET ?? 'dev-secret';

/**
 * Computes an HMAC-SHA256 fingerprint over the given payload string.
 * In production this will call Person C's RFC 2104 implementation.
 */
export function computeHmac(payload: string): string {
  return crypto.createHmac('sha256', SERVER_SECRET).update(payload).digest('hex');
}

/**
 * Verifies an HMAC fingerprint using constant-time comparison.
 */
export function verifyHmac(payload: string, expectedHmac: string): boolean {
  const computed = Buffer.from(computeHmac(payload));
  const expected = Buffer.from(expectedHmac);
  if (computed.length !== expected.length) return false;
  return crypto.timingSafeEqual(computed, expected);
}
