import crypto from 'crypto';

/**
 * Big number utilities using JavaScript's native BigInt for cryptographic operations.
 * Uses crypto.randomBytes for secure entropy — NOT a crypto library, just randomness.
 */

/**
 * Computes (base^exponent) mod modulus using the square-and-multiply algorithm.
 */
export function modExp(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus === 1n) return 0n;
  let result = 1n;
  base = base % modulus;
  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      result = (result * base) % modulus;
    }
    exponent = exponent / 2n;
    base = (base * base) % modulus;
  }
  return result;
}

/**
 * Computes gcd(a, b) using the Euclidean algorithm.
 */
export function gcd(a: bigint, b: bigint): bigint {
  while (b > 0n) {
    [a, b] = [b, a % b];
  }
  return a;
}

/**
 * Computes the modular inverse of a mod m using the Extended Euclidean Algorithm.
 * Returns x such that (a * x) % m == 1.
 * Throws an error if the inverse doesn't exist (i.e. a and m are not coprime).
 */
export function modInverse(a: bigint, m: bigint): bigint {
  const m0 = m;
  let x0 = 0n;
  let x1 = 1n;

  if (m === 1n) return 0n;

  while (a > 1n) {
    const q = a / m;
    let t = m;
    m = a % m;
    a = t;
    t = x0;
    x0 = x1 - q * x0;
    x1 = t;
  }

  if (x1 < 0n) x1 += m0;
  return x1;
}

/**
 * Miller-Rabin primality test.
 * @param n Number to test
 * @param k Number of witness iterations (40 is very conservative)
 * @returns true if probably prime, false if definitely composite
 */
export function isProbablePrime(n: bigint, k: number = 40): boolean {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n) return false;

  // Write n-1 as 2^r * d
  let d = n - 1n;
  let r = 0n;
  while (d % 2n === 0n) {
    d /= 2n;
    r++;
  }

  // Generate a cryptographically secure random BigInt in [2, n-2]
  const getSecureRandomBase = (max: bigint): bigint => {
    const byteLen = Math.ceil(max.toString(16).length / 2) + 1;
    let num: bigint;
    do {
      const buf = crypto.randomBytes(byteLen);
      num = BigInt('0x' + buf.toString('hex'));
    } while (num < 2n || num > max - 2n);
    return num;
  };

  witness: for (let i = 0; i < k; i++) {
    const a = getSecureRandomBase(n);
    let x = modExp(a, d, n);

    if (x === 1n || x === n - 1n) continue;

    for (let j = 0n; j < r - 1n; j++) {
      x = modExp(x, 2n, n);
      if (x === n - 1n) continue witness;
    }

    return false;
  }

  return true;
}

/**
 * Generates a cryptographically random large prime of specified bit length.
 * Uses crypto.randomBytes for secure entropy (not the crypto RSA/ECC operations).
 */
export function generateLargePrime(bits: number): bigint {
  const bytes = Math.ceil(bits / 8);

  while (true) {
    const buf = crypto.randomBytes(bytes);

    // Set the top bit to ensure full bit-length
    buf[0] |= 0x80;
    // Set the bottom bit to ensure it's odd
    buf[bytes - 1] |= 0x01;

    const candidate = BigInt('0x' + buf.toString('hex'));

    if (isProbablePrime(candidate)) {
      return candidate;
    }
  }
}
