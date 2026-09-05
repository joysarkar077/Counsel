/**
 * File encryption/decryption using ECIES over secp256k1.
 *
 * Replaces the previous AES-256-GCM implementation. Files are encrypted
 * using the same ECIES XOR-keystream primitive as text fields (ecc.ts),
 * extended to arbitrary binary length via the ANSI X9.63 counter-mode KDF.
 *
 * Each file gets its own ephemeral ECC keypair so that file keys are
 * independent from case or user keys.
 *
 * NOTE: This module uses Node.js `crypto` and must run in a Node/Edge
 * environment (server component or Web Worker). It must NOT be used in
 * a browser-only context without a polyfill.
 */
import crypto from 'crypto';
import { generateKeyPair, encrypt, decrypt, type ECIESCiphertext, type DecryptResult } from './ecc';

export type { ECIESCiphertext as ECIESFileBundle };

/**
 * Typed result for file decryption — matches the text decrypt result shape.
 */
export type FileDecryptResult =
  | { ok: true; data: Uint8Array }
  | { ok: false; error: 'MAC_MISMATCH' | 'POINT_AT_INFINITY' | 'INVALID_INPUT' };

/**
 * Encrypts a binary file buffer using ECIES over secp256k1.
 *
 * Uses the same ANSI X9.63 KDF + XOR-cipher + HMAC-SHA256 MAC as text ECIES.
 * The binary buffer is hex-encoded before passing to the ECIES encrypt function,
 * then decoded back on the decrypt path — preserving the exact byte sequence.
 *
 * @param fileBuffer - Raw file bytes as Uint8Array
 * @param recipientPublicKey - Recipient's ECC public key in 'x,y' hex format
 * @returns ECIES bundle { ephemeralPublicKey, ciphertext, mac }
 */
export function encryptFileECIES(
  fileBuffer: Uint8Array,
  recipientPublicKey: string,
): ECIESCiphertext {
  // Encode binary as hex so that the ECIES encrypt() (UTF-8 string path) can handle it.
  // The hex encoding doubles the byte count but ensures lossless round-trip for any binary.
  const hexEncoded = Buffer.from(fileBuffer).toString('hex');
  return encrypt(hexEncoded, recipientPublicKey);
}

/**
 * Decrypts an ECIES file bundle back to the original binary bytes.
 *
 * @param bundle - ECIES bundle produced by encryptFileECIES()
 * @param privateKey - Recipient's ECC private key hex scalar
 * @returns Typed result: ok=true with Uint8Array data, or ok=false with error code
 */
export function decryptFileECIES(
  bundle: ECIESCiphertext,
  privateKey: string,
): FileDecryptResult {
  const result = decrypt(bundle, privateKey);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  // plaintext is the hex-encoded binary — decode back to bytes
  try {
    const data = new Uint8Array(Buffer.from(result.plaintext, 'hex'));
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'INVALID_INPUT' };
  }
}

/**
 * Generates a fresh ECC keypair for encrypting a single file.
 * The file private key (scalar) must be stored securely (e.g., ECIES-encrypted
 * to the case public key) alongside the file URL so decryption is possible.
 *
 * Returns the same shape as generateKeyPair() from ecc.ts.
 */
export { generateKeyPair as generateFileKeyPair };
