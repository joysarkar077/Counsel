/**
 * Text encryption/decryption using ECIES over secp256k1.
 *
 * This module replaces the previous AES-256-GCM implementation.
 * It is a thin, adapter layer over ecc.ts that provides the same interface
 * shape that existing components expect, while the actual crypto lives in ecc.ts.
 *
 * Compatible with both Browser (Client Components) and Node.js (Server Components).
 * The underlying ecc.ts uses Node's `crypto` module; in a pure-browser environment
 * the caller must ensure a Node.js-compatible crypto is available (e.g., via a polyfill
 * or by keeping all ECIES calls in Server Components / API routes).
 */

export type {
  ECIESCiphertext,
  ECCKeyPair,
  DecryptResult,
} from './ecc';

export {
  encrypt as encryptECIES,
  decrypt as decryptECIES,
  decryptOrFallback,
  generateKeyPair,
} from './ecc';

/**
 * Encrypts a UTF-8 string with ECIES.
 * Alias of `encrypt` from ecc.ts kept for call-site readability.
 *
 * @param text - Plaintext UTF-8 string
 * @param recipientPublicKey - ECC public key in 'x,y' hex format
 * @returns ECIESCiphertext bundle { ephemeralPublicKey, ciphertext, mac }
 */
export { encrypt as encryptText } from './ecc';

/**
 * Decrypts an ECIES bundle to a UTF-8 string.
 * Returns a typed Result — callers MUST check result.ok before using result.plaintext.
 *
 * @param bundle - ECIESCiphertext bundle from encryptText()
 * @param privateKey - ECC private key scalar as hex string
 */
export { decrypt as decryptText } from './ecc';
