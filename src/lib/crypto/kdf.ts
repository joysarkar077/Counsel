/**
 * PBKDF-style password hashing, from scratch.
 *
 * Uses HMAC-SHA256 (from ./hmac.ts) as the PRF in an iterative
 * key-derivation loop inspired by PBKDF2 (RFC 2898 §5.2).
 *
 * Each iteration chains: U_i = HMAC(password, U_{i-1})
 * where U_0 = salt || INT_32_BE(1).
 * The final derived key is the cumulative XOR of all U_i blocks.
 */

import { randomBytes } from 'crypto';
import { hmacSha256 } from './hmac';
import { constantTimeEqual } from './utils';

const DEFAULT_ITERATIONS = 10_000;
const SALT_LENGTH_BYTES = 16;
const DERIVED_KEY_LENGTH_BYTES = 32; // SHA-256 output size

export interface HashedPassword {
  hash: string;      // hex-encoded derived key
  salt: string;      // hex-encoded random salt
  iterations: number; // iteration count used
}

/**
 * Derives a key from a password and salt using iterated HMAC-SHA256,
 * following the PBKDF2 structure (RFC 2898 §5.2).
 *
 * DK = T_1 where T_i = U_1 ^ U_2 ^ ... ^ U_c
 * U_1 = HMAC(password, salt || INT_32_BE(blockIndex))
 * U_j = HMAC(password, U_{j-1})   for j = 2..c
 *
 * @param password - The raw password as a Buffer
 * @param salt - The salt as a Buffer
 * @param iterations - Number of HMAC iterations
 * @returns The derived key as a 32-byte Buffer
 */
function pbkdf2Derive(
  password: Buffer,
  salt: Buffer,
  iterations: number,
): Buffer {
  // U_1 = HMAC(password, salt || INT_32_BE(1))
  const saltBlock = Buffer.alloc(salt.length + 4);
  salt.copy(saltBlock, 0);
  saltBlock.writeUInt32BE(1, salt.length);

  let u = hmacSha256(password, saltBlock);
  const result = Buffer.from(u);

  // U_2 .. U_c: chain and XOR-accumulate
  for (let i = 1; i < iterations; i++) {
    u = hmacSha256(password, u);
    for (let j = 0; j < DERIVED_KEY_LENGTH_BYTES; j++) {
      result[j] ^= u[j];
    }
  }

  return result;
}

/**
 * Hashes a password with a fresh random salt and the default iteration count.
 *
 * @param password - The plaintext password to hash
 * @returns An object containing the hex-encoded hash, salt, and iteration count
 */
export function hashPassword(password: string): HashedPassword {
  const salt = randomBytes(SALT_LENGTH_BYTES);
  const passwordBuf = Buffer.from(password, 'utf-8');
  const derived = pbkdf2Derive(passwordBuf, salt, DEFAULT_ITERATIONS);

  return {
    hash: derived.toString('hex'),
    salt: salt.toString('hex'),
    iterations: DEFAULT_ITERATIONS,
  };
}

/**
 * Verifies a plaintext password against a stored hash using constant-time compare.
 *
 * @param password - The plaintext password to verify
 * @param hash - The hex-encoded stored hash
 * @param salt - The hex-encoded salt used during hashing
 * @param iterations - The iteration count used during hashing
 * @returns true if the password matches
 */
export function verifyPassword(
  password: string,
  hash: string,
  salt: string,
  iterations: number,
): boolean {
  const passwordBuf = Buffer.from(password, 'utf-8');
  const saltBuf = Buffer.from(salt, 'hex');
  const derived = pbkdf2Derive(passwordBuf, saltBuf, iterations);

  return constantTimeEqual(derived, Buffer.from(hash, 'hex'));
}

/**
 * Generates a random salt.
 * Provided for compatibility with older stub signatures.
 */
export function generateSalt(): string {
  return randomBytes(SALT_LENGTH_BYTES).toString('hex');
}

/**
 * Generates a blind index for emails so we can look up users without decrypting the DB.
 * Uses our from-scratch HMAC-SHA256.
 */
export function generateEmailBlindIndex(email: string): string {
  const secret = Buffer.from(process.env.BLIND_INDEX_KEY || 'default-blind-index-key-do-not-use-in-prod', 'utf-8');
  return hmacSha256(secret, Buffer.from(email.toLowerCase(), 'utf-8')).toString('hex');
}
