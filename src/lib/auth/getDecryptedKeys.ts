/**
 * getDecryptedKeys.ts
 *
 * Server-side helper that retrieves the current user's decrypted private keys
 * from the NextAuth JWT session.
 *
 * After the private-key encryption migration (keyVersion=2), private keys are
 * no longer stored as plaintext in MongoDB. They are decrypted once at login,
 * placed into the encrypted NextAuth JWT, and read back here on every server
 * request — without ever touching the database again.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export interface DecryptedKeys {
  /** Raw ECC secp256k1 private scalar hex — used for ECIES decryption. */
  eccPrivateKey: string;
  /** Raw RSA private exponent `d` hex — used for RSA signing. */
  rsaPrivateKey: string;
}

/**
 * Reads the decrypted private keys from the NextAuth session JWT.
 *
 * Returns empty strings if the session does not contain keys (e.g. the user
 * has an old session cookie from before the migration). In that case the caller
 * should treat all ECIES operations as unavailable and redirect to re-login if needed.
 *
 * @returns DecryptedKeys with eccPrivateKey and rsaPrivateKey
 */
export async function getDecryptedKeys(): Promise<DecryptedKeys> {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  return {
    eccPrivateKey: user?.eccPrivateKey ?? '',
    rsaPrivateKey: user?.rsaPrivateKey ?? '',
  };
}
