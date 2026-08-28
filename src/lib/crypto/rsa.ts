import crypto from 'crypto';
import { generateLargePrime, modExp, modInverse, gcd } from './bignum';

export interface RSAPublicKey {
  e: string; // hex
  n: string; // hex
}

export interface RSAPrivateKey {
  d: string; // hex
  n: string; // hex
}

export interface RSAKeyPair {
  publicKey: RSAPublicKey;
  privateKey: RSAPrivateKey;
}

/**
 * Generates an RSA keypair from scratch.
 * Default 2048 bits for production security.
 * Use 512 or 1024 only for testing (faster).
 */
export function generateKeyPair(bits: number = 2048): RSAKeyPair {
  const e = 65537n;

  while (true) {
    const p = generateLargePrime(Math.floor(bits / 2));
    const q = generateLargePrime(Math.floor(bits / 2));

    if (p === q) continue;

    const n = p * q;
    const phi = (p - 1n) * (q - 1n);

    // e and phi must be coprime
    if (gcd(e, phi) !== 1n) continue;

    let d: bigint;
    try {
      d = modInverse(e, phi);
    } catch {
      continue;
    }

    return {
      publicKey: { e: e.toString(16), n: n.toString(16) },
      privateKey: { d: d.toString(16), n: n.toString(16) },
    };
  }
}

/**
 * Calculates the safe maximum plaintext bytes per RSA block.
 * For a key of N hex chars, the modulus is (N*4) bits.
 * We leave 2 bytes of headroom to ensure m < n.
 */
function getBlockSize(nHex: string): { maxPlainBytes: number; cipherBlockHexLen: number } {
  const modulusBits = nHex.length * 4;
  const modulusBytes = Math.ceil(modulusBits / 8);
  // Safe: plaintext block is 2 bytes smaller than modulus to guarantee m < n
  const maxPlainBytes = modulusBytes - 2;
  // Cipher block is always padded to full modulus hex length for predictable splitting
  const cipherBlockHexLen = modulusBytes * 2;
  return { maxPlainBytes, cipherBlockHexLen };
}

/**
 * RSA-encrypts a plaintext string using the given public key.
 * Splits into blocks to handle arbitrary-length input.
 */
export function encrypt(plaintext: string, publicKey: RSAPublicKey): string {
  const e = BigInt('0x' + publicKey.e);
  const n = BigInt('0x' + publicKey.n);
  const { maxPlainBytes, cipherBlockHexLen } = getBlockSize(publicKey.n);

  const buffer = Buffer.from(plaintext, 'utf8');
  const chunks: string[] = [];

  for (let i = 0; i < buffer.length; i += maxPlainBytes) {
    const chunk = buffer.subarray(i, i + maxPlainBytes);
    // Prepend 0x01 so leading-zero bytes in the chunk are preserved
    const padded = Buffer.concat([Buffer.from([0x01]), chunk]);
    const m = BigInt('0x' + padded.toString('hex'));

    if (m >= n) throw new Error('RSA: Block too large for modulus');

    const c = modExp(m, e, n);
    chunks.push(c.toString(16).padStart(cipherBlockHexLen, '0'));
  }

  return chunks.join('');
}

/**
 * RSA-decrypts a ciphertext hex string using the given private key.
 */
export function decrypt(ciphertextHex: string, privateKey: RSAPrivateKey): string {
  const d = BigInt('0x' + privateKey.d);
  const n = BigInt('0x' + privateKey.n);
  const { cipherBlockHexLen } = getBlockSize(privateKey.n);

  let result = Buffer.alloc(0);

  for (let i = 0; i < ciphertextHex.length; i += cipherBlockHexLen) {
    const cHex = ciphertextHex.slice(i, i + cipherBlockHexLen);
    const c = BigInt('0x' + cHex);
    const m = modExp(c, d, n);

    let mHex = m.toString(16);
    if (mHex.length % 2 !== 0) mHex = '0' + mHex;

    const chunkBuf = Buffer.from(mHex, 'hex');
    // Strip the 0x01 padding byte prepended during encryption
    result = Buffer.concat([result, chunkBuf.subarray(1)]);
  }

  return result.toString('utf8');
}

/**
 * RSA-signs a message using the private key.
 * Hashes with SHA-256 first, then applies RSA to the hash.
 */
export function sign(message: string, privateKey: RSAPrivateKey): string {
  const hash = crypto.createHash('sha256').update(message, 'utf8').digest('hex');
  const hBig = BigInt('0x' + hash);
  const d = BigInt('0x' + privateKey.d);
  const n = BigInt('0x' + privateKey.n);
  return modExp(hBig, d, n).toString(16);
}

/**
 * Verifies an RSA signature using the public key.
 * Returns true if the signature is valid, false otherwise.
 */
export function verify(message: string, signatureHex: string, publicKey: RSAPublicKey): boolean {
  const hash = crypto.createHash('sha256').update(message, 'utf8').digest('hex');
  const expected = BigInt('0x' + hash);
  const e = BigInt('0x' + publicKey.e);
  const n = BigInt('0x' + publicKey.n);
  const s = BigInt('0x' + signatureHex);
  const recovered = modExp(s, e, n);
  return expected === recovered;
}
