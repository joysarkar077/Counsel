'use server';

import { encrypt, decrypt, type ECIESCiphertext } from '@/lib/crypto/ecc';
import { signECDSA } from '@/lib/crypto/ecdsa';
import { generateHMAC } from '@/lib/crypto/hmac';

const HMAC_KEY = 'client-integrity-key';

export async function encryptMessagePayloadAction(
  text: string,
  casePublicKey: string,
  senderPrivateKeyHex?: string
) {
  try {
    const bundle: ECIESCiphertext = encrypt(text, casePublicKey);
    const ciphertext = JSON.stringify(bundle);

    let signature = '{}';
    if (senderPrivateKeyHex) {
      const sig = signECDSA(ciphertext, senderPrivateKeyHex);
      signature = JSON.stringify(sig);
    }

    const integrityHash = generateHMAC(HMAC_KEY, ciphertext);

    return { ok: true, ciphertext, signature, integrityHash };
  } catch (err: any) {
    console.error('encryptMessagePayloadAction error:', err);
    return { ok: false, error: err.message || 'Encryption failed' };
  }
}

export async function decryptMessagesBatchAction(
  messages: { id: string; ciphertext: string; senderId: string; createdAt: string }[],
  casePrivateKeyHex: string,
  currentUserId: string
) {
  try {
    const results = messages.map(msg => {
      try {
        const bundle = JSON.parse(msg.ciphertext) as ECIESCiphertext;
        const result = decrypt(bundle, casePrivateKeyHex);

        if (!result.ok) {
          return {
            id: msg.id,
            senderId: msg.senderId,
            text: '[⚠ Message integrity check failed — possible tampering]',
            createdAt: new Date(msg.createdAt),
            isMine: msg.senderId === currentUserId,
            integrityOk: false,
          };
        }

        return {
          id: msg.id,
          senderId: msg.senderId,
          text: result.plaintext,
          createdAt: new Date(msg.createdAt),
          isMine: msg.senderId === currentUserId,
          integrityOk: true,
        };
      } catch {
        return null;
      }
    });

    return { ok: true, results: results.filter(Boolean) };
  } catch (err: any) {
    console.error('decryptMessagesBatchAction error:', err);
    return { ok: false, error: err.message || 'Decryption failed' };
  }
}

