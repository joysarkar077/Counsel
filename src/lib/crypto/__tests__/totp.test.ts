/**
 * Unit tests for totp.ts (HOTP / TOTP)
 * Run with: npx tsx --test src/lib/crypto/__tests__/totp.test.ts
 */

import { strict as assert } from 'assert';
import { test, describe } from 'node:test';
import { hotp, totp, verifyTotp } from '../totp';

/**
 * RFC 4226 Appendix D defines test vectors for HMAC-SHA1. Our project
 * standardizes on HMAC-SHA256 as the PRF, so the raw OTP values differ.
 * The vectors below were computed with our HMAC-SHA256 implementation
 * against the same canonical secret to verify that the dynamic-truncation
 * logic (§5.3) is wired correctly.
 */
const RFC_SECRET = Buffer.from('12345678901234567890', 'ascii');

/** HOTP-SHA256 expected values for counters 0–9 */
const HOTP_SHA256_VECTORS: readonly string[] = [
  '875740', // counter 0
  '247374', // counter 1
  '254785', // counter 2
  '496144', // counter 3
  '480556', // counter 4
  '697997', // counter 5
  '191609', // counter 6
  '579288', // counter 7
  '895912', // counter 8
  '184989', // counter 9
];

describe('HOTP (RFC 4226 §5.3 dynamic truncation, HMAC-SHA256)', () => {
  for (let counter = 0; counter < HOTP_SHA256_VECTORS.length; counter++) {
    test(`counter ${counter} → ${HOTP_SHA256_VECTORS[counter]}`, () => {
      const result = hotp(RFC_SECRET, counter);
      assert.equal(result, HOTP_SHA256_VECTORS[counter]);
    });
  }

  test('output is always 6 digits (zero-padded)', () => {
    for (let c = 0; c < 20; c++) {
      const code = hotp(RFC_SECRET, c);
      assert.equal(code.length, 6, `counter ${c} produced ${code}`);
      assert.match(code, /^\d{6}$/);
    }
  });
});

describe('TOTP (RFC 6238, HMAC-SHA256)', () => {
  test('totp returns a 6-digit string', () => {
    const code = totp(RFC_SECRET, 30);
    assert.equal(code.length, 6);
    assert.match(code, /^\d{6}$/);
  });

  test('totp is deterministic within the same 30-second window', () => {
    const code1 = totp(RFC_SECRET, 30);
    const code2 = totp(RFC_SECRET, 30);
    assert.equal(code1, code2);
  });
});

describe('verifyTotp (drift-window tolerance)', () => {
  test('accepts a code generated right now', () => {
    const code = totp(RFC_SECRET, 30);
    assert.equal(verifyTotp(RFC_SECRET, code, 30, 1), true);
  });

  test('rejects a completely wrong code', () => {
    assert.equal(verifyTotp(RFC_SECRET, '000000', 30, 0), false);
  });

  test('rejects code from a far-future counter (outside drift window)', () => {
    const farCounter = Math.floor(Date.now() / 1000 / 30) + 100;
    const farCode = hotp(RFC_SECRET, farCounter);
    assert.equal(verifyTotp(RFC_SECRET, farCode, 30, 1), false);
  });

  test('accepts code from counter ±1 when driftWindow = 1', () => {
    const currentCounter = Math.floor(Date.now() / 1000 / 30);
    const prevCode = hotp(RFC_SECRET, currentCounter - 1);
    const nextCode = hotp(RFC_SECRET, currentCounter + 1);

    assert.equal(verifyTotp(RFC_SECRET, prevCode, 30, 1), true);
    assert.equal(verifyTotp(RFC_SECRET, nextCode, 30, 1), true);
  });
});
