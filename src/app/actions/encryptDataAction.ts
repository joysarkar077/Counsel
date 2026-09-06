'use server';

import { encrypt as encryptECIES } from '@/lib/crypto/ecc';

/**
 * Server action to ECIES-encrypt data for a case, bypassing the client's lack of Node.js crypto.
 *
 * @param data - The raw data (string, object, array) to encrypt
 * @param casePublicKey - The ECC 'x,y' public key string
 * @returns The JSON-stringified ECIESCiphertext bundle ready for the API
 */
export async function encryptDataAction(data: any, casePublicKey: string) {
  try {
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
    const bundle = encryptECIES(jsonStr, casePublicKey);
    return { ok: true, payload: JSON.stringify(bundle) };
  } catch (err: any) {
    console.error('encryptDataAction error:', err);
    return { ok: false, error: err.message || 'Encryption failed on server' };
  }
}

