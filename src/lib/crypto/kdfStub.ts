import crypto from 'crypto';

/**
 * STUB: Farjana (Person C) will provide the real implementation from scratch.
 * This stub uses native node crypto just to allow Person A to integrate.
 */

export function hashPassword(password: string, salt: string): string {
  // Simulates a slow KDF
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const hash = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

/**
 * Generates a blind index for emails so we can look up users without decrypting the DB.
 */
export function generateEmailBlindIndex(email: string): string {
  // In a real system, this should use a server-side secret key (e.g. SERVER_SECRET)
  // For the stub, we just SHA-256 it
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
}
