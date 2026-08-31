/**
 * Unit tests for kdf.ts
 * Run with: npx tsx --test src/lib/crypto/__tests__/kdf.test.ts
 */

import { strict as assert } from 'assert';
import { test, describe } from 'node:test';
import { hashPassword, verifyPassword } from '../kdf';

describe('PBKDF2-style KDF', () => {
  test('hashPassword returns hex hash, hex salt, and iteration count', () => {
    const result = hashPassword('correct-horse-battery-staple');

    assert.equal(typeof result.hash, 'string');
    assert.equal(typeof result.salt, 'string');
    assert.equal(typeof result.iterations, 'number');
    // SHA-256 output = 32 bytes = 64 hex chars
    assert.equal(result.hash.length, 64);
    // 16-byte salt = 32 hex chars
    assert.equal(result.salt.length, 32);
    assert.equal(result.iterations, 10_000);
  });

  test('same password + same salt + same iterations → same hash (deterministic)', () => {
    const result1 = hashPassword('mypassword');
    const result2Verified = verifyPassword(
      'mypassword',
      result1.hash,
      result1.salt,
      result1.iterations,
    );
    assert.equal(result2Verified, true);
  });

  test('different salts → different hashes for the same password', () => {
    const result1 = hashPassword('samepassword');
    const result2 = hashPassword('samepassword');

    // Two calls produce different random salts
    assert.notEqual(result1.salt, result2.salt);
    // Therefore the derived hashes must differ
    assert.notEqual(result1.hash, result2.hash);
  });

  test('verifyPassword returns true for the correct password', () => {
    const { hash, salt, iterations } = hashPassword('hunter2');
    assert.equal(verifyPassword('hunter2', hash, salt, iterations), true);
  });

  test('verifyPassword returns false for a wrong password', () => {
    const { hash, salt, iterations } = hashPassword('hunter2');
    assert.equal(verifyPassword('hunter3', hash, salt, iterations), false);
  });

  test('verifyPassword returns false for a tampered hash', () => {
    const { hash, salt, iterations } = hashPassword('hunter2');
    const tampered = 'ff' + hash.slice(2);
    assert.equal(verifyPassword('hunter2', tampered, salt, iterations), false);
  });

  test('verifyPassword returns false for a tampered salt', () => {
    const { hash, salt, iterations } = hashPassword('hunter2');
    const tamperedSalt = 'ff' + salt.slice(2);
    assert.equal(verifyPassword('hunter2', hash, tamperedSalt, iterations), false);
  });
});
