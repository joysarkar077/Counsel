import crypto from 'crypto';
import { generateLargePrime, modExp, modInverse } from './bignum';

export interface RSAPublicKey {
  e: string; // Stored as hex string
  n: string; // Stored as hex string
}

export interface RSAPrivateKey {
  d: string; // Stored as hex string
  n: string; // Stored as hex string
}

export interface RSAKeyPair {
  publicKey: RSAPublicKey;
  privateKey: RSAPrivateKey;
}

/**
 * Generates an RSA keypair from scratch.
 * @param bits Total bits for the modulus n (e.g., 2048)
 */
export function generateKeyPair(bits: number = 2048): RSAKeyPair {
  const e = 65537n;
  let p = 0n;
  let q = 0n;
  let n = 0n;
  let phi = 0n;
  let d = 0n;

  while (true) {
    p = generateLargePrime(Math.floor(bits / 2));
    q = generateLargePrime(Math.floor(bits / 2));
    if (p === q) continue;

    n = p * q;
    phi = (p - 1n) * (q - 1n);

    if (phi % e === 0n) continue;

    try {
      d = modInverse(e, phi);
      break;
    } catch {
      // If inverse fails (not coprime), just generate again
      continue;
    }
  }

  return {
    publicKey: { e: e.toString(16), n: n.toString(16) },
    privateKey: { d: d.toString(16), n: n.toString(16) }
  };
}

/**
 * Encrypts a plaintext string using the public key.
 * Splits the string into blocks to handle data larger than n.
 */
export function encrypt(plaintext: string, publicKey: RSAPublicKey): string {
  const e = BigInt('0x' + publicKey.e);
  const n = BigInt('0x' + publicKey.n);
  
  // Calculate max chunk size in bytes. 
  // n is roughly 'bits' long. Max bytes we can safely encrypt is (bits / 8) - 1.
  const hexN = publicKey.n;
  const maxBytes = Math.floor((hexN.length * 4) / 8) - 1;
  const blockOutputHexLen = Math.ceil((hexN.length * 4) / 8) * 2;
  
  const buffer = Buffer.from(plaintext, 'utf8');
  let cipherChunks: string[] = [];

  for (let i = 0; i < buffer.length; i += maxBytes) {
    const chunk = buffer.subarray(i, i + maxBytes);
    // Convert chunk to BigInt (prefix with 01 to preserve leading zeros)
    // We add a '1' byte at the start of every chunk to ensure leading zeros in the actual text aren't lost during hex conversion.
    const paddedChunk = Buffer.concat([Buffer.from([0x01]), chunk]);
    const m = BigInt('0x' + paddedChunk.toString('hex'));
    
    if (m >= n) {
      throw new Error('Chunk is larger than modulus, encryption failed.');
    }

    const c = modExp(m, e, n);
    // Pad output block with zeros so they can be concatenated predictably
    let cHex = c.toString(16);
    cHex = cHex.padStart(blockOutputHexLen, '0');
    cipherChunks.push(cHex);
  }

  return cipherChunks.join('');
}

/**
 * Decrypts a ciphertext hex string using the private key.
 */
export function decrypt(ciphertextHex: string, privateKey: RSAPrivateKey): string {
  const d = BigInt('0x' + privateKey.d);
  const n = BigInt('0x' + privateKey.n);
  
  const blockOutputHexLen = Math.ceil((privateKey.n.length * 4) / 8) * 2;
  
  let plaintextBuffer = Buffer.alloc(0);

  for (let i = 0; i < ciphertextHex.length; i += blockOutputHexLen) {
    const cHex = ciphertextHex.slice(i, i + blockOutputHexLen);
    const c = BigInt('0x' + cHex);
    
    const m = modExp(c, d, n);
    let mHex = m.toString(16);
    // Ensure even length for Buffer hex parsing
    if (mHex.length % 2 !== 0) mHex = '0' + mHex;
    
    const chunkBuffer = Buffer.from(mHex, 'hex');
    // Strip the '0x01' padding byte we added during encryption
    const unpaddedChunk = chunkBuffer.subarray(1);
    
    plaintextBuffer = Buffer.concat([plaintextBuffer, unpaddedChunk]);
  }

  return plaintextBuffer.toString('utf8');
}

/**
 * Signs a message using the private key.
 * Hashes the message first via SHA-256, then signs the hash.
 */
export function sign(message: string, privateKey: RSAPrivateKey): string {
  const hash = crypto.createHash('sha256').update(message, 'utf8').digest('hex');
  const hBig = BigInt('0x' + hash);
  const d = BigInt('0x' + privateKey.d);
  const n = BigInt('0x' + privateKey.n);

  const signature = modExp(hBig, d, n);
  return signature.toString(16);
}

/**
 * Verifies a signature using the public key.
 */
export function verify(message: string, signatureHex: string, publicKey: RSAPublicKey): boolean {
  const hash = crypto.createHash('sha256').update(message, 'utf8').digest('hex');
  const expectedHashBig = BigInt('0x' + hash);
  
  const e = BigInt('0x' + publicKey.e);
  const n = BigInt('0x' + publicKey.n);
  const s = BigInt('0x' + signatureHex);

  const recoveredHashBig = modExp(s, e, n);
  
  return expectedHashBig === recoveredHashBig;
}
