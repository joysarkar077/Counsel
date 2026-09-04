/**
 * Unit tests for rsa.ts
 * Run with: npx tsx --test src/lib/crypto/__tests__/rsa.test.ts
 */

import { strict as assert } from 'assert';
import { test, describe } from 'node:test';
import { generateKeyPair, encrypt, decrypt, sign, verify } from '../rsa';

// Generate a shared keypair once for the suite (use small key for test speed)
const TEST_KEY_BITS = 512;
let keyPair: ReturnType<typeof generateKeyPair>;

describe('generateKeyPair', () => {
  test('generates a valid keypair with hex strings', () => {
    keyPair = generateKeyPair(TEST_KEY_BITS);
    assert.ok(keyPair.publicKey.e, 'Missing public exponent e');
    assert.ok(keyPair.publicKey.n, 'Missing modulus n');
    assert.ok(keyPair.privateKey.d, 'Missing private exponent d');
    assert.ok(keyPair.privateKey.n, 'Missing modulus n in private key');
    assert.equal(keyPair.publicKey.n, keyPair.privateKey.n, 'n must match in both keys');
  });

  test('public exponent is 65537', () => {
    assert.equal(BigInt('0x' + keyPair.publicKey.e), 65537n);
  });
});

describe('encrypt / decrypt', () => {
  test('short string roundtrip', () => {
    const msg = 'Hello, Counsel!';
    const ciphertext = encrypt(msg, keyPair.publicKey);
    const recovered = decrypt(ciphertext, keyPair.privateKey);
    assert.equal(recovered, msg);
  });

  test('multi-block string roundtrip (PII-length)', () => {
    const msg = 'Sajid Mahir | sajid.mahir@example.com | +880 1711-234567';
    const ciphertext = encrypt(msg, keyPair.publicKey);
    const recovered = decrypt(ciphertext, keyPair.privateKey);
    assert.equal(recovered, msg);
  });

  test('empty string roundtrip', () => {
    const msg = '';
    const ciphertext = encrypt(msg, keyPair.publicKey);
    const recovered = decrypt(ciphertext, keyPair.privateKey);
    assert.equal(recovered, msg);
  });

  test('decryption with wrong key fails to produce original message', () => {
    const msg = 'secret content';
    const wrongKeyPair = generateKeyPair(TEST_KEY_BITS);
    const ciphertext = encrypt(msg, keyPair.publicKey);
    // Decrypting with the wrong private key should not throw — but output won't match
    let recovered: string;
    try {
      recovered = decrypt(ciphertext, wrongKeyPair.privateKey);
    } catch {
      recovered = '';
    }
    assert.notEqual(recovered, msg, 'Wrong key should not recover the plaintext');
  });
});

describe('sign / verify', () => {
  test('valid signature verifies correctly', async () => {
    const msg = 'case_status_change|ACTIVE|CLOSE_REQUESTED';
    const sig = await sign(msg, keyPair.privateKey);
    assert.equal(await verify(msg, sig, keyPair.publicKey), true);
  });

  test('tampered message fails verification', async () => {
    const msg = 'case_status_change|ACTIVE|CLOSE_REQUESTED';
    const sig = await sign(msg, keyPair.privateKey);
    const tamperedMsg = '{"user_id":"123","role":"super_admin"}';
    assert.equal(await verify(tamperedMsg, sig, keyPair.publicKey), false);
  });

  test('tampered signature fails verification', async () => {
    const msg = 'case_status_change|ACTIVE|CLOSE_REQUESTED';
    const sig = await sign(msg, keyPair.privateKey);
    // Tamper with the signature string
    const tamperedSig = sig.slice(0, -4) + 'ffff';
    assert.equal(await verify(msg, tamperedSig, keyPair.publicKey), false);
  });

  test('signature from wrong key fails verification', async () => {
    const msg = 'some important state change';
    const wrongKeyPair = generateKeyPair(TEST_KEY_BITS);
    const sig = await sign(msg, keyPair.privateKey);
    assert.equal(await verify(msg, sig, keyPair.publicKey), false);
  });
});
