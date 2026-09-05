/**
 * Unit tests for hmac.ts
 * Run with: npx tsx --test src/lib/crypto/hmac.test.ts
 */

import { strict as assert } from 'assert';
import { test, describe } from 'node:test';
import * as crypto from 'crypto';
import { hmacSha256, generateHMAC, verifyHMAC } from './hmac';

describe('HMAC-SHA256 (RFC 2104 / RFC 4231 Test Vectors)', () => {
  test('RFC 4231 Test Case 1: Key = 0x0b*20, Data = "Hi There"', () => {
    const key = Buffer.alloc(20, 0x0b);
    const data = Buffer.from('Hi There', 'utf-8');
    const expected = 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7';

    const result = hmacSha256(key, data);
    assert.equal(result.toString('hex'), expected);
  });

  test('RFC 4231 Test Case 2: Key = "Jefe", Data = "what do ya want for nothing?"', () => {
    const key = Buffer.from('Jefe', 'utf-8');
    const data = Buffer.from('what do ya want for nothing?', 'utf-8');
    const expected = '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843';

    const result = hmacSha256(key, data);
    assert.equal(result.toString('hex'), expected);
  });

  test('RFC 4231 Test Case 3: Key = 0xaa*20, Data = 0xdd*50', () => {
    const key = Buffer.alloc(20, 0xaa);
    const data = Buffer.alloc(50, 0xdd);
    const expected = '773ea91e36800e46854db8ebd09181a72959098b3ef8c122d9635514ced565fe';

    const result = hmacSha256(key, data);
    assert.equal(result.toString('hex'), expected);
  });

  test('RFC 4231 Test Case 6: Key > 64 bytes (131 bytes of 0xaa)', () => {
    const key = Buffer.alloc(131, 0xaa);
    const data = Buffer.from('Test Using Larger Than Block-Size Key - Hash Key First', 'utf-8');
    const expected = '60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54';

    const result = hmacSha256(key, data);
    assert.equal(result.toString('hex'), expected);
  });

  test('RFC 4231 Test Case 7: Key > 64 bytes and Data > 64 bytes', () => {
    const key = Buffer.alloc(131, 0xaa);
    const data = Buffer.from(
      'This is a test using a larger than block-size key and a larger than block-size data. The key needs to be hashed before being used by the HMAC algorithm.',
      'utf-8'
    );
    const expected = '9b09ffa71b942fcb27635fbcd5b0e944bfdc63644f0713938a7f51535c3a35e2';

    const result = hmacSha256(key, data);
    assert.equal(result.toString('hex'), expected);
  });

  test('Matches Node.js crypto.createHmac for arbitrary inputs', () => {
    const randomKey = crypto.randomBytes(48);
    const randomMsg = crypto.randomBytes(256);

    const fromScratch = hmacSha256(randomKey, randomMsg);
    const standard = crypto.createHmac('sha256', randomKey).update(randomMsg).digest();

    assert.equal(fromScratch.toString('hex'), standard.toString('hex'));
  });

  test('generateHMAC and verifyHMAC helpers', () => {
    const key = 'secret-counsel-key';
    const message = 'case-content-hash-payload';

    const mac = generateHMAC(key, message);
    assert.equal(verifyHMAC(key, message, mac), true);
    assert.equal(verifyHMAC(key, message + 'tampered', mac), false);
    assert.equal(verifyHMAC('wrong-key', message, mac), false);
  });
});


