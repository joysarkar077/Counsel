/**
 * Unit tests for bignum.ts
 * Run with: node --test src/lib/crypto/__tests__/bignum.test.ts
 * (Requires Node 18+ and ts-node or tsx)
 */

import { strict as assert } from 'assert';
import { test, describe } from 'node:test';
import { modExp, modInverse, gcd, isProbablePrime, generateLargePrime } from '../bignum';

describe('modExp', () => {
  test('2^10 mod 1000 = 24', () => {
    assert.equal(modExp(2n, 10n, 1000n), 24n);
  });

  test('3^4 mod 5 = 1', () => {
    assert.equal(modExp(3n, 4n, 5n), 1n);
  });

  test('returns 0 when modulus is 1', () => {
    assert.equal(modExp(999n, 999n, 1n), 0n);
  });

  test('large base and exponent', () => {
    // Fermat's little theorem: a^(p-1) mod p = 1 for prime p
    const p = 97n;
    assert.equal(modExp(2n, p - 1n, p), 1n);
  });
});

describe('gcd', () => {
  test('gcd(12, 8) = 4', () => {
    assert.equal(gcd(12n, 8n), 4n);
  });

  test('gcd of coprime numbers = 1', () => {
    assert.equal(gcd(65537n, 60n), 1n);
  });

  test('gcd(0, n) = n', () => {
    assert.equal(gcd(0n, 42n), 42n);
  });
});

describe('modInverse', () => {
  test('inverse of 3 mod 11 is 4', () => {
    const inv = modInverse(3n, 11n);
    assert.equal((3n * inv) % 11n, 1n);
  });

  test('inverse roundtrip: (a * modInverse(a, m)) % m === 1', () => {
    const a = 65537n;
    const m = 999999999999999877n; // large prime
    const inv = modInverse(a, m);
    assert.equal((a * inv) % m, 1n);
  });
});

describe('isProbablePrime', () => {
  test('known primes return true', () => {
    for (const p of [2n, 3n, 5n, 7n, 11n, 97n, 65537n]) {
      assert.equal(isProbablePrime(p), true, `Expected ${p} to be prime`);
    }
  });

  test('known composites return false', () => {
    for (const c of [1n, 4n, 9n, 100n, 200n, 1000n]) {
      assert.equal(isProbablePrime(c), false, `Expected ${c} to be composite`);
    }
  });

  test('0 and 1 are not prime', () => {
    assert.equal(isProbablePrime(0n), false);
    assert.equal(isProbablePrime(1n), false);
  });
});

describe('generateLargePrime', () => {
  test('generated 64-bit prime passes isProbablePrime', () => {
    const p = generateLargePrime(64);
    assert.equal(isProbablePrime(p), true);
  });

  test('generated prime is odd', () => {
    const p = generateLargePrime(64);
    assert.equal(p % 2n, 1n);
  });

  test('generated 128-bit prime has correct bit length range', () => {
    const p = generateLargePrime(128);
    const bitLen = p.toString(2).length;
    assert.ok(bitLen >= 127, `Expected >= 127 bits, got ${bitLen}`);
    assert.ok(bitLen <= 128, `Expected <= 128 bits, got ${bitLen}`);
  });
});
