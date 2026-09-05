/**
 * ECIES tests for ecc.ts.
 *
 * Covers: round-trip correctness, MAC tamper detection, edge inputs,
 * Unicode correctness, and key-generation guard rails.
 *
 * Spec references: SEC 1 Â§4.1, Â§5.1; ANSI X9.63 KDF Â§3.6.1
 */
import { generateKeyPair, encrypt, decrypt, decryptOrFallback } from '../ecc';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Flip a single bit at byte-position `byteIndex` in a hex string. */
function flipBit(hex: string, byteIndex: number): string {
  const buf = Buffer.from(hex, 'hex');
  buf[byteIndex % buf.length] ^= 0x01;
  return buf.toString('hex');
}

// ---------------------------------------------------------------------------
// Key generation
// ---------------------------------------------------------------------------

describe('generateKeyPair', () => {
  it('produces a non-zero private key scalar', () => {
    const { privateKey } = generateKeyPair();
    expect(BigInt(`0x${privateKey}`)).toBeGreaterThan(0n);
  });

  it('produces distinct keypairs on each call', () => {
    const a = generateKeyPair();
    const b = generateKeyPair();
    expect(a.privateKey).not.toBe(b.privateKey);
    expect(a.publicKey).not.toBe(b.publicKey);
  });

  it('public key has the x,y hex format', () => {
    const { publicKey } = generateKeyPair();
    expect(publicKey).toMatch(/^[0-9a-f]+,[0-9a-f]+$/);
  });
});

// ---------------------------------------------------------------------------
// Round-trip correctness
// ---------------------------------------------------------------------------

describe('encrypt â†’ decrypt round-trip', () => {
  const { privateKey, publicKey } = generateKeyPair();

  it('decrypts to the original ASCII plaintext', () => {
    const plaintext = 'Hello, legal world!';
    const bundle = encrypt(plaintext, publicKey);
    const result = decrypt(bundle, privateKey);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.plaintext).toBe(plaintext);
  });

  it('decrypts multi-byte Unicode correctly', () => {
    const plaintext = 'Â§ 5(a)(ii) â€” à¦ªà§à¦°à¦¤à¦¿à¦¬à¦¾à¦¦à§€ åå‰ ðŸ”';
    const bundle = encrypt(plaintext, publicKey);
    const result = decrypt(bundle, privateKey);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.plaintext).toBe(plaintext);
  });

  it('encrypts and decrypts an empty string', () => {
    const bundle = encrypt('', publicKey);
    const result = decrypt(bundle, privateKey);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.plaintext).toBe('');
  });

  it('encrypts and decrypts a very long string (>1 KDF block)', () => {
    const plaintext = 'A'.repeat(1000);
    const bundle = encrypt(plaintext, publicKey);
    const result = decrypt(bundle, privateKey);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.plaintext).toBe(plaintext);
  });

  it('produces different ciphertexts for the same plaintext (ephemeral r)', () => {
    const plaintext = 'Same message';
    const b1 = encrypt(plaintext, publicKey);
    const b2 = encrypt(plaintext, publicKey);
    expect(b1.ciphertext).not.toBe(b2.ciphertext);
    expect(b1.ephemeralPublicKey).not.toBe(b2.ephemeralPublicKey);
  });
});

// ---------------------------------------------------------------------------
// MAC tamper detection
// ---------------------------------------------------------------------------

describe('MAC tamper detection', () => {
  const { privateKey, publicKey } = generateKeyPair();
  const plaintext = 'Top secret legal document';

  it('rejects a ciphertext with a flipped bit', () => {
    const bundle = encrypt(plaintext, publicKey);
    const tampered = { ...bundle, ciphertext: flipBit(bundle.ciphertext, 0) };
    const result = decrypt(tampered, privateKey);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('MAC_MISMATCH');
  });

  it('rejects a bundle with a modified ephemeral public key', () => {
    const bundle = encrypt(plaintext, publicKey);
    // Replace ephemeral key with a different keypair's public key
    const other = generateKeyPair();
    const tampered = { ...bundle, ephemeralPublicKey: other.publicKey };
    const result = decrypt(tampered, privateKey);
    // Either MAC_MISMATCH or INVALID_INPUT â€” both mean rejection
    expect(result.ok).toBe(false);
  });

  it('rejects a bundle with a zeroed-out MAC', () => {
    const bundle = encrypt(plaintext, publicKey);
    const tampered = { ...bundle, mac: '0'.repeat(bundle.mac.length) };
    const result = decrypt(tampered, privateKey);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('MAC_MISMATCH');
  });

  it('rejects a bundle with a truncated MAC', () => {
    const bundle = encrypt(plaintext, publicKey);
    const tampered = { ...bundle, mac: bundle.mac.slice(0, 32) };
    const result = decrypt(tampered, privateKey);
    expect(result.ok).toBe(false);
  });

  it('rejects decryption with the wrong private key', () => {
    const { privateKey: wrongKey } = generateKeyPair();
    const bundle = encrypt(plaintext, publicKey);
    const result = decrypt(bundle, wrongKey);
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Invalid input handling
// ---------------------------------------------------------------------------

describe('invalid input handling', () => {
  const { privateKey, publicKey } = generateKeyPair();

  it('returns INVALID_INPUT when bundle is missing mac field', () => {
    const bundle = encrypt('test', publicKey);
    const tampered = { ephemeralPublicKey: bundle.ephemeralPublicKey, ciphertext: bundle.ciphertext, mac: '' };
    const result = decrypt(tampered, privateKey);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('INVALID_INPUT');
  });

  it('decryptOrFallback returns fallback on tamper', () => {
    const bundle = encrypt('secret', publicKey);
    const tampered = { ...bundle, mac: 'bad' };
    const out = decryptOrFallback(tampered, privateKey, 'FALLBACK');
    expect(out).toBe('FALLBACK');
  });

  it('decryptOrFallback returns plaintext on valid bundle', () => {
    const bundle = encrypt('valid', publicKey);
    expect(decryptOrFallback(bundle, privateKey)).toBe('valid');
  });
});


