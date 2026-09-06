/**
 * secp256k1 elliptic curve arithmetic primitives.
 *
 * Provides the finite-field math and curve point operations needed
 * by the ECIES encryption layer (ecc.ts). Nothing in this file performs
 * I/O or holds protocol logic.
 *
 * Curve definition: SEC 2 §2.4.1
 * Point arithmetic: SEC 1 §2.2.1
 */

// ---------------------------------------------------------------------------
// Curve parameters (SEC 2 §2.4.1)
// These are spec-fixed constants — do not rename.
// ---------------------------------------------------------------------------

/** Prime field modulus. */
export const P = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F');

/** Curve coefficient a (zero for secp256k1). */
export const A = 0n;

/** Curve coefficient b. */
export const B = 7n;

/** x-coordinate of the base point G. */
const Gx = BigInt('0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798');

/** y-coordinate of the base point G. */
const Gy = BigInt('0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8');

/** Order of the base point (the group order N). */
export const N = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

/** The base point G on the curve. */
export const G: Point = { x: Gx, y: Gy };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * An affine point on the secp256k1 curve, or the additive identity
 * (point at infinity).
 */
export type Point = { x: bigint; y: bigint } | 'infinity';

// ---------------------------------------------------------------------------
// Field arithmetic
// ---------------------------------------------------------------------------

/**
 * Modular exponentiation: computes base^exp mod m using square-and-multiply.
 * Operates entirely over BigInt to avoid precision loss.
 *
 * @param base - The base value
 * @param exp  - The exponent (non-negative)
 * @param mod  - The modulus
 */
export function modpow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base = ((base % mod) + mod) % mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
  }
  return result;
}

/**
 * Modular multiplicative inverse of a over the field P.
 * Uses Fermat's little theorem: a^{-1} = a^{P-2} mod P, valid because P is prime.
 *
 * @param a - The value to invert (must not be 0 mod P)
 */
export function modInvP(a: bigint): bigint {
  return modpow(a, P - 2n, P);
}

// ---------------------------------------------------------------------------
// Curve point operations (SEC 1 §2.2.1)
// ---------------------------------------------------------------------------

/**
 * Adds two affine points on secp256k1.
 *
 * Handles the degenerate cases:
 *   - Either operand is the point at infinity (identity element).
 *   - Both points share the same x-coordinate: either point doubling
 *     (same y) or additive inverses yielding the point at infinity.
 *
 * SEC 1 §2.2.1 — affine point addition formula.
 */
export function pointAdd(P1: Point, P2: Point): Point {
  if (P1 === 'infinity') return P2;
  if (P2 === 'infinity') return P1;

  if (P1.x === P2.x) {
    // Additive inverses: P + (-P) = identity
    if (P1.y !== P2.y) return 'infinity';
    // Same point: use the doubling formula instead
    return pointDouble(P1);
  }

  // General case: slope lambda = (y2 - y1) / (x2 - x1) mod P
  const lambda = (((P2.y - P1.y) % P) * modInvP((P2.x - P1.x + P) % P)) % P;
  const x3 = ((lambda * lambda - P1.x - P2.x) % P + P) % P;
  const y3 = ((lambda * (P1.x - x3) - P1.y) % P + P) % P;
  return { x: x3, y: y3 };
}

/**
 * Doubles an affine point on secp256k1 (computes P + P).
 *
 * Uses the tangent-line slope formula:
 *   lambda = (3x^2 + a) / (2y) mod P
 * The a=0 simplification holds for secp256k1.
 *
 * SEC 1 §2.2.1 — affine point doubling formula.
 */
export function pointDouble(pt: Point): Point {
  if (pt === 'infinity') return 'infinity';

  // lambda = (3x^2) / (2y) mod P  — a=0 simplification
  const lambda = ((3n * pt.x * pt.x * modInvP((2n * pt.y) % P)) % P + P) % P;
  const x3 = ((lambda * lambda - 2n * pt.x) % P + P) % P;
  const y3 = ((lambda * (pt.x - x3) - pt.y) % P + P) % P;
  return { x: x3, y: y3 };
}

/**
 * Computes the scalar multiple k*P using the double-and-add algorithm.
 * Processes k bit by bit from LSB to MSB.
 *
 * SEC 1 §2.2.1.
 *
 * @param k  - The scalar multiplier (positive integer)
 * @param pt - The base point to multiply
 */
export function scalarMultiply(k: bigint, pt: Point): Point {
  let result: Point = 'infinity';
  let addend: Point = pt;
  while (k > 0n) {
    if (k & 1n) result = pointAdd(result, addend);
    addend = pointDouble(addend);
    k >>= 1n;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Point encoding helpers
// ---------------------------------------------------------------------------

/**
 * Encodes a finite curve point to a stable 'x,y' hex string.
 * Throws if the point is at infinity, which cannot be meaningfully serialized.
 */
export function encodePoint(pt: Point): string {
  if (pt === 'infinity') throw new Error('secp256k1: cannot encode point at infinity');
  return `${pt.x.toString(16)},${pt.y.toString(16)}`;
}

/**
 * Decodes a 'x,y' hex string back to an affine Point.
 * Does not validate that the point lies on the curve — callers must ensure
 * the input originates from a trusted source (e.g., a stored public key).
 */
export function decodePoint(encoded: string): Point {
  const [xHex, yHex] = encoded.split(',');
  return { x: BigInt(`0x${xHex}`), y: BigInt(`0x${yHex}`) };
}
