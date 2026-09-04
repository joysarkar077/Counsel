/**
 * Utilities for encrypting/decrypting text using AES-256-GCM.
 * Compatible with both Browser (Client Components) and Node.js (Server Components).
 */

// Use global crypto object which is available in Browser (window.crypto) and Node (globalThis.crypto)
const getCrypto = () => {
  if (typeof window !== 'undefined' && window.crypto) return window.crypto;
  if (typeof globalThis !== 'undefined' && globalThis.crypto) return globalThis.crypto;
  // Fallback for older Node versions if necessary
  return require('crypto').webcrypto;
};

export async function generateAESKey(): Promise<CryptoKey> {
  const crypto = getCrypto();
  return crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

export async function exportAESKey(key: CryptoKey): Promise<string> {
  const crypto = getCrypto();
  const exported = await crypto.subtle.exportKey('raw', key);
  return Buffer.from(exported).toString('hex');
}

export async function importAESKey(hexStr: string): Promise<CryptoKey> {
  const crypto = getCrypto();
  const keyBytes = Buffer.from(hexStr, 'hex');
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedTextResult {
  ciphertextHex: string;
  ivHex: string;
}

export async function encryptText(text: string, key: CryptoKey): Promise<EncryptedTextResult> {
  const crypto = getCrypto();
  const encoder = new TextEncoder();
  const encodedText = encoder.encode(text);
  
  // 12 bytes is the recommended IV size for AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedText
  );

  const ivHex = Buffer.from(iv).toString('hex');
  const ciphertextHex = Buffer.from(encryptedBuffer).toString('hex');

  return { ciphertextHex, ivHex };
}

export async function decryptText(ciphertextHex: string, ivHex: string, key: CryptoKey): Promise<string> {
  const crypto = getCrypto();
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedBuffer = Buffer.from(ciphertextHex, 'hex');
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv),
    },
    key,
    encryptedBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
