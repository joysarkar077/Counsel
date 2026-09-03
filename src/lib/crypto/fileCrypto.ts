// Utilities for encrypting files using AES-GCM in the browser

/**
 * Generate a random AES-GCM key for encrypting a file.
 */
export async function generateAESKey(): Promise<CryptoKey> {
  return window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Export an AES key to raw bytes, returned as a hex string.
 * This hex string can then be RSA encrypted.
 */
export async function exportAESKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return Buffer.from(exported).toString('hex');
}

/**
 * Import an AES key from a hex string.
 */
export async function importAESKey(hexStr: string): Promise<CryptoKey> {
  const keyBytes = Buffer.from(hexStr, 'hex');
  return window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

export interface EncryptedFileResult {
  encryptedBlob: Blob;
  ivHex: string;
}

/**
 * Encrypts a File or Blob using AES-GCM.
 * The IV is randomly generated and must be stored/sent alongside the ciphertext.
 */
export async function encryptFile(file: Blob, key: CryptoKey): Promise<EncryptedFileResult> {
  const arrayBuffer = await file.arrayBuffer();
  
  // 12 bytes is the recommended IV size for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    arrayBuffer
  );

  const ivHex = Buffer.from(iv).toString('hex');
  const encryptedBlob = new Blob([encryptedBuffer]);

  return { encryptedBlob, ivHex };
}

/**
 * Decrypts an ArrayBuffer (fetched from Uploadthing) using AES-GCM.
 */
export async function decryptFile(encryptedBuffer: ArrayBuffer, key: CryptoKey, ivHex: string): Promise<Blob> {
  const iv = Buffer.from(ivHex, 'hex');
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(iv),
    },
    key,
    encryptedBuffer
  );

  return new Blob([decryptedBuffer]);
}
