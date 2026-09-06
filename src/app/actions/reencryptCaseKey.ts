'use server';

import { decrypt as decryptECIES, encrypt as encryptECIES, type ECIESCiphertext } from '@/lib/crypto/ecc';

/**
 * Server action: decrypt the caller's copy of the case private scalar, then
 * re-encrypt it to the target user's ECC public key.
 *
 * Both operations require Node.js `crypto` (timingSafeEqual, createHmac, etc.)
 * and must run server-side — they cannot be called directly in a Client Component.
 *
 * @param encryptedCaseKey  - JSON-serialised ECIESCiphertext bundle (caller's copy)
 * @param callerPrivateKeyHex - Caller's ECC private scalar hex
 * @param recipientPublicKeyHex - Recipient's ECC public key 'x,y' hex
 * @returns JSON-serialised ECIESCiphertext bundle encrypted to the recipient
 */
export async function reencryptCaseKeyAction(
  encryptedCaseKey: string,
  callerPrivateKeyHex: string,
  recipientPublicKeyHex: string,
): Promise<{ ok: true; encryptedCaseKey: string } | { ok: false; error: string }> {
  try {
    // 1. Decrypt the case private scalar using the caller's ECC private key
    const bundle: ECIESCiphertext = JSON.parse(encryptedCaseKey);
    const decryptResult = decryptECIES(bundle, callerPrivateKeyHex);
    if (!decryptResult.ok) {
      return { ok: false, error: `Decryption failed: ${decryptResult.error}` };
    }
    const casePrivateKeyHex = decryptResult.plaintext;

    // 2. Re-encrypt the case private scalar to the recipient's ECC public key
    if (!recipientPublicKeyHex || recipientPublicKeyHex.startsWith('{')) {
      return { ok: false, error: 'Recipient does not have a valid ECC public key.' };
    }
    const newBundle = encryptECIES(casePrivateKeyHex, recipientPublicKeyHex);

    return { ok: true, encryptedCaseKey: JSON.stringify(newBundle) };
  } catch (err: any) {
    console.error('reencryptCaseKeyAction error:', err);
    return { ok: false, error: err?.message ?? 'Unknown error during key re-encryption.' };
  }
}

