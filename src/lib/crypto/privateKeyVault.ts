/**
 * privateKeyVault.ts
 *
 * Seals and unseals user private keys at rest using password-derived ECIES.
 *
 * Design:
 *   - A deterministic ECC keypair is derived from the user's password+salt via
 *     `deriveECCKeyFromPassword` (PBKDF2 → secp256k1 scalar). This is the "vault key".
 *   - The real ECC private key and RSA private key (`d` scalar) are each
 *     ECIES-encrypted under the vault keypair's public key and stored as JSON bundles.
 *   - To unseal: re-derive the vault keypair from the password, then ECIES-decrypt.
 *
 * No AES is used at any point — encryption is exclusively asymmetric (ECIES).
 */

import { encrypt, decrypt, type ECIESCiphertext } from './ecc';
import { deriveECCKeyFromPassword } from './kdf';

export interface SealedKeys {
  /** JSON-serialised ECIESCiphertext wrapping the ECC private scalar hex. */
  sealedECC: string;
  /** JSON-serialised ECIESCiphertext wrapping the RSA private exponent d hex. */
  sealedRSA: string;
}

/**
 * Seals (encrypts) both private keys under a password-derived ECIES keypair.
 *
 * Called at registration and key rotation. After this, the raw private key
 * scalars are discarded — only the sealed bundles are stored in MongoDB.
 *
 * @param eccPrivHex  - The raw ECC private scalar hex (64 chars)
 * @param rsaPrivHex  - The raw RSA private exponent `d` hex
 * @param password    - The user's plaintext password (available at registration/rotation)
 * @param saltHex     - The user's password salt hex (already stored on the User document)
 * @returns SealedKeys containing two JSON ECIES bundle strings
 */
export function sealPrivateKeys(
  eccPrivHex: string,
  rsaPrivHex: string,
  password: string,
  saltHex: string,
): SealedKeys {
  // Derive the vault keypair — only someone who knows the password can recreate this
  const vaultKeyPair = deriveECCKeyFromPassword(password, saltHex);

  // ECIES-encrypt each private key under the vault public key
  const eccBundle: ECIESCiphertext = encrypt(eccPrivHex, vaultKeyPair.publicKey);
  const rsaBundle: ECIESCiphertext = encrypt(rsaPrivHex, vaultKeyPair.publicKey);

  return {
    sealedECC: JSON.stringify(eccBundle),
    sealedRSA: JSON.stringify(rsaBundle),
  };
}

/**
 * Unseals (decrypts) both private keys using a re-derived vault keypair.
 *
 * Called at login (after password is verified). Returns the raw private key
 * scalars that can then be stored securely in the NextAuth JWT.
 *
 * @param sealedECC   - JSON-serialised ECIESCiphertext (the sealedECC from the DB)
 * @param sealedRSA   - JSON-serialised ECIESCiphertext (the sealedRSA from the DB)
 * @param password    - The user's plaintext password
 * @param saltHex     - The user's password salt hex
 * @returns The raw private key hex strings, or throws on decryption failure
 */
export function unsealPrivateKeys(
  sealedECC: string,
  sealedRSA: string,
  password: string,
  saltHex: string,
): { eccPrivHex: string; rsaPrivHex: string } {
  // Re-derive the same vault keypair — deterministic for the same password+salt
  const vaultKeyPair = deriveECCKeyFromPassword(password, saltHex);

  const eccBundle: ECIESCiphertext = JSON.parse(sealedECC);
  const rsaBundle: ECIESCiphertext = JSON.parse(sealedRSA);

  const eccResult = decrypt(eccBundle, vaultKeyPair.privateKey);
  if (!eccResult.ok) {
    throw new Error(`Failed to unseal ECC private key: ${eccResult.error}`);
  }

  const rsaResult = decrypt(rsaBundle, vaultKeyPair.privateKey);
  if (!rsaResult.ok) {
    throw new Error(`Failed to unseal RSA private key: ${rsaResult.error}`);
  }

  return {
    eccPrivHex: eccResult.plaintext,
    rsaPrivHex: rsaResult.plaintext,
  };
}

/**
 * Detects whether a stored private key field is in legacy plaintext format
 * (raw hex scalar) or the new sealed ECIES bundle format (JSON string starting with `{`).
 *
 * Used during migration to avoid double-sealing keys that were already sealed.
 *
 * @param storedValue - The value from `user.encryptedPrivateKey` or `user.rsaPrivateKey`
 * @returns true if the value is already a sealed ECIES bundle
 */
export function isSealed(storedValue: string): boolean {
  return storedValue.trimStart().startsWith('{');
}
