import crypto from 'crypto';
import {
  _scalarMultiply,
  _pointAdd,
  CURVE_N,
  CURVE_P,
  CURVE_G,
  generateKeyPair,
  ECCKeyPair,
} from './ecc';

/**
 * ECDSA signature over secp256k1, implemented from scratch.
 *
 * Implements RFC 6979 §2.3 deterministic k-generation is NOT used here;
 * instead k is sampled randomly as per the original ECDSA spec (ANSI X9.62 §5.3).
 *
 * Sign: SEC 1 §4.1.3
 * Verify: SEC 1 §4.1.4
 *
 * NOTE: This module reuses the field-arithmetic primitives from ecc.ts
 * (pointAdd, scalarMultiply, CURVE_N, CURVE_P, CURVE_G) rather than
 * reimplementing them, following the modular code design rule.
 */

// Re-export ECCKeyPair so callers can import the type from here if needed
export type { ECCKeyPair };

export interface ECDSASignature {
  /** r component as lowercase hex string */
  r: string;
  /** s component as lowercase hex string */
  s: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Modular inverse of a mod N using Fermat's little theorem (N is prime). */
function modInvN(a: bigint): bigint {
  let result = 1n;
  let base = ((a % CURVE_N) + CURVE_N) % CURVE_N;
  let exp = CURVE_N - 2n;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % CURVE_N;
    exp >>= 1n;
    base = (base * base) % CURVE_N;
  }
  return result;
}

/** Hash a message string to a bigint using SHA-256. */
function hashToBigInt(message: string): bigint {
  const digest = crypto.createHash('sha256').update(message, 'utf8').digest();
  return BigInt(`0x${digest.toString('hex')}`);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export { generateKeyPair };

/**
 * Signs a message using ECDSA over secp256k1.
 * ANSI X9.62 §5.3 / SEC 1 §4.1.3.
 *
 * A random ephemeral scalar k is sampled per-signature. For production-grade
 * security, RFC 6979 deterministic k would be preferred, but random k is spec-correct.
 *
 * @param message - The UTF-8 plaintext message to sign
 * @param privateKey - Hex-encoded private key scalar d
 * @returns { r, s } signature components as hex strings
 */
export function signECDSA(message: string, privateKey: string): ECDSASignature {
  const d = BigInt(`0x${privateKey}`);
  const z = hashToBigInt(message);

  let r = 0n;
  let s = 0n;

  // Retry on degenerate k values (r=0 or s=0 are invalid per spec)
  while (r === 0n || s === 0n) {
    // Sample random k in [1, N-1]
    let k: bigint;
    do {
      k = BigInt(`0x${crypto.randomBytes(32).toString('hex')}`);
    } while (k === 0n || k >= CURVE_N);

    // R = k·G; r = R.x mod N
    const R = _scalarMultiply(k, CURVE_G);
    if (R === 'infinity') continue;

    r = R.x % CURVE_N;
    if (r === 0n) continue;

    // s = k⁻¹ · (z + r·d) mod N
    s = (modInvN(k) * ((z + r * d) % CURVE_N)) % CURVE_N;
  }

  return {
    r: r.toString(16).padStart(64, '0'),
    s: s.toString(16).padStart(64, '0'),
  };
}

/**
 * Verifies an ECDSA signature over secp256k1.
 * SEC 1 §4.1.4.
 *
 * @param message - The UTF-8 plaintext message that was signed
 * @param sig - { r, s } signature components as hex strings
 * @param publicKey - Hex 'x,y' ECC public key of the signer
 * @returns true if the signature is valid, false otherwise
 */
export function verifyECDSA(
  message: string,
  sig: ECDSASignature,
  publicKey: string,
): boolean {
  try {
    const r = BigInt(`0x${sig.r}`);
    const s = BigInt(`0x${sig.s}`);

    // Reject out-of-range signature components
    if (r <= 0n || r >= CURVE_N) return false;
    if (s <= 0n || s >= CURVE_N) return false;

    const z = hashToBigInt(message);
    const [xHex, yHex] = publicKey.split(',');
    const Q = { x: BigInt(`0x${xHex}`), y: BigInt(`0x${yHex}`) };

    // w = s⁻¹ mod N
    const w = modInvN(s);
    const u1 = (z * w) % CURVE_N;
    const u2 = (r * w) % CURVE_N;

    // Point X = u1·G + u2·Q
    const P1 = _scalarMultiply(u1, CURVE_G);
    const P2 = _scalarMultiply(u2, Q);
    const X = _pointAdd(P1, P2);

    if (X === 'infinity') return false;

    // Signature valid iff X.x ≡ r (mod N)
    return X.x % CURVE_N === r;
  } catch {
    return false;
  }
}

/**
 * Legacy compatibility shim.
 * The old ecdsa.ts exposed verifySignature(publicKeyPem, data, signatureHex).
 * New callers should use verifyECDSA() directly.
 *
 * @deprecated Use verifyECDSA() instead.
 */
export function verifySignature(
  publicKeyHex: string,
  data: string,
  signatureHex: string,
): boolean {
  // Parse packed r||s hex (128 chars = 64r + 64s)
  if (signatureHex.length !== 128) return false;
  const sig: ECDSASignature = {
    r: signatureHex.slice(0, 64),
    s: signatureHex.slice(64, 128),
  };
  return verifyECDSA(data, sig, publicKeyHex);
}
