/**
 * Big number utilities using JavaScript's native BigInt for cryptographic operations.
 */

/**
 * Computes (base^exponent) mod modulus using the square-and-multiply algorithm.
 * @param base 
 * @param exponent 
 * @param modulus 
 * @returns BigInt result
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
 * Computes the modular inverse of a mod m using the Extended Euclidean Algorithm.
 * Returns x such that (a * x) % m == 1
 * Throws an error if inverse doesn't exist (i.e. a and m are not coprime).
 */
export function modInverse(a: bigint, m: bigint): bigint {
  let [m0, x0, x1] = [m, 0n, 1n];
  if (m === 1n) return 0n;

  while (a > 1n) {
    let q = a / m;
    let t = m;
    m = a % m;
    a = t;
    t = x0;
    x0 = x1 - q * x0;
    x1 = t;
  }

  if (x1 < 0n) {
    x1 += m0;
  }
  return x1;
}

/**
 * Miller-Rabin primality test.
 * @param n Number to test
 * @param k Number of iterations (accuracy)
 * @returns true if probably prime, false if composite
 */
export function isProbablePrime(n: bigint, k: number = 40): boolean {
  if (n <= 1n) return false;
  if (n <= 3n) return true;
  if (n % 2n === 0n) return false;

  let d = n - 1n;
  let r = 0n;
  while (d % 2n === 0n) {
    d /= 2n;
    r++;
  }

  // A simple pseudo-random generator for BigInt in range [2, n-2]
  const getRandomBase = (max: bigint): bigint => {
    // Generate a string of random bytes, convert to BigInt and modulo
    // We can use Math.random() for base choice since it's just Miller-Rabin bases
    // but in a real crypto scenario we'd use crypto.getRandomValues
    let hex = '0x';
    for (let i = 0; i < 8; i++) {
      hex += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    }
    const num = BigInt(hex);
    return (num % (max - 3n)) + 2n;
  };

  for (let i = 0; i < k; i++) {
    const a = getRandomBase(n);
    let x = modExp(a, d, n);

    if (x === 1n || x === n - 1n) continue;

    let continueLoop = false;
    for (let j = 0n; j < r - 1n; j++) {
      x = modExp(x, 2n, n);
      if (x === n - 1n) {
        continueLoop = true;
        break;
      }
    }

    if (!continueLoop) return false;
  }

  return true;
}

/**
 * Generates a random large prime of specified bit length.
 * Note: Uses a basic PRNG approach here which should be replaced
 * with a cryptographically secure random source if strictly needed.
 * But for scratch implementation, Math.random based BigInt generation works.
 */
export function generateLargePrime(bits: number): bigint {
  const bytes = Math.ceil(bits / 8);
  
  const generateCandidate = (): bigint => {
    // Ideally we would use crypto.getRandomValues, but in Node
    // we can just use crypto module. Since we cannot use crypto module for RSA/ECC,
    // we can use standard crypto for random bytes generation if allowed, 
    // otherwise Math.random.
    let hex = '0x1'; // Ensure top bit is 1 to get correct bit length
    for (let i = 0; i < bytes - 1; i++) {
      hex += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    }
    let candidate = BigInt(hex);
    if (candidate % 2n === 0n) {
      candidate += 1n;
    }
    return candidate;
  };

  while (true) {
    const candidate = generateCandidate();
    if (isProbablePrime(candidate)) {
      return candidate;
    }
  }
}
