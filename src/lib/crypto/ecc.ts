/**
 * ECIES (Elliptic Curve Integrated Encryption Scheme) over secp256k1.
 *
 * Implements SEC 1 §5.1: key generation, encrypt, and decrypt. All
 * elliptic curve field arithmetic is delegated to secp256k1.ts, keeping
 * this file focused solely on the ECIES protocol layer.
 *
 * Encryption flow:
 *   1. Generate ephemeral keypair (r, R=r*G).
 *   2. Derive shared secret S = r * Q_recipient  (ECDH).
 *   3. Expand two independent keys from S via ANSI X9.63 KDF:
 *        - macKey  (counter=0)
 *        - keystream (counter>=1)
 *   4. XOR keystream with plaintext to produce ciphertext.
 *   5. Compute HMAC-SHA256(macKey, ciphertext) as integrity tag.
 *
 * Decryption is the symmetric reverse, with MAC verification before decryption
 * to prevent chosen-ciphertext attacks.
 */

import crypto from 'crypto';
import { hmacSha256 } from './hmac';
import {
  N, G,
  type Point,
  scalarMultiply,
  encodePoint,
  decodePoint,
} from './secp256k1';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** ECC key pair: private scalar and uncompressed public point. */
export interface ECCKeyPair {
  /** Private key as a 64-char hex string (32 bytes). */
  readonly privateKey: string;
  /** Public key as a 'x,y' hex string pair. */
  readonly publicKey: string;
}

/**
 * ECIES ciphertext bundle produced by encrypt().
 * All three fields are required for decryption.
 *
 * SEC 1 §5.1 — ECIES with ANSI X9.63 KDF and HMAC-SHA256 integrity tag.
 */
export interface ECIESCiphertext {
  /** Ephemeral public key R = r*G, serialized as 'x,y' hex. */
  readonly ephemeralPublicKey: string;
  /** XOR-encrypted ciphertext as a lowercase hex string. */
  readonly ciphertext: string;
  /**
   * HMAC-SHA256 integrity tag over the raw ciphertext bytes.
   * The MAC key is derived from the ECDH shared secret using counter=0.
   * This tag must be verified before decryption to block padding oracle
   * and chosen-ciphertext attacks.
   */
  readonly mac: string;
}

/**
 * Typed result returned by decrypt().
 * Callers must branch on ok before accessing plaintext.
 *
 * Using a Result type rather than throwing keeps expected failures
 * (bad key, tampered ciphertext) from propagating as unhandled exceptions.
 */
export type DecryptResult =
  | { ok: true; plaintext: string }
  | { ok: false; error: 'MAC_MISMATCH' | 'POINT_AT_INFINITY' | 'INVALID_INPUT' };

// ---------------------------------------------------------------------------
// ANSI X9.63 KDF helpers
// ---------------------------------------------------------------------------

/**
 * Expands a shared curve point into a keystream of the requested byte length.
 *
 * Uses the ANSI X9.63 KDF pattern: iterate SHA-256(S_x || counter_4BE)
 * with counter starting at 1, concatenating 32-byte blocks until enough
 * bytes are available.
 *
 * Counter 0 is reserved for the MAC key (see deriveMacKey), ensuring the
 * MAC key is always independent of the cipher keystream.
 *
 * ANSI X9.63 §3.6.1.
 *
 * @param sharedPoint - The ECDH shared point S
 * @param length      - Number of keystream bytes to produce
 */
function deriveKeystream(sharedPoint: Point, length: number): Buffer {
  if (sharedPoint === 'infinity') throw new Error('ECIES: shared point is infinity');

  // Use only the x-coordinate of the shared point (standard ECDH convention)
  const sharedBytes = Buffer.from(sharedPoint.x.toString(16).padStart(64, '0'), 'hex');
  const chunks: Buffer[] = [];
  let counter = 1;

  while (chunks.reduce((acc, c) => acc + c.length, 0) < length) {
    const counterBuf = Buffer.alloc(4);
    counterBuf.writeUInt32BE(counter++);
    const hash = crypto.createHash('sha256').update(sharedBytes).update(counterBuf).digest();
    chunks.push(hash);
  }

  return Buffer.concat(chunks).subarray(0, length);
}

/**
 * Derives the MAC key from a shared curve point using counter=0.
 *
 * Reserving counter=0 for the MAC key ensures it is cryptographically
 * independent from any keystream block (which start at counter=1).
 *
 * ANSI X9.63 KDF §3.6.1.
 *
 * @param sharedPoint - The ECDH shared point S
 */
function deriveMacKey(sharedPoint: Point): Buffer {
  if (sharedPoint === 'infinity') throw new Error('ECIES: shared point is infinity for MAC');

  const sharedBytes = Buffer.from(sharedPoint.x.toString(16).padStart(64, '0'), 'hex');
  // counter=0 is reserved for MAC key derivation
  const counterBuf = Buffer.alloc(4);
  return crypto.createHash('sha256').update(sharedBytes).update(counterBuf).digest();
}

/**
 * Computes HMAC-SHA256 over ciphertext bytes using the derived MAC key.
 * Delegates to the from-scratch hmacSha256 implementation in hmac.ts.
 *
 * RFC 2104.
 */
function computeMac(macKey: Buffer, ciphertextBuf: Buffer): string {
  return hmacSha256(macKey, ciphertextBuf).toString('hex');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a fresh ECC key pair on secp256k1.
 *
 * The private key d is sampled uniformly at random from [1, N-1].
 * The public key Q = d*G is the corresponding curve point.
 *
 * @returns An { privateKey, publicKey } pair where both values are hex strings.
 */
export function generateKeyPair(): ECCKeyPair {
  let d: bigint;
  do {
    d = BigInt(`0x${crypto.randomBytes(32).toString('hex')}`);
  } while (d === 0n || d >= N);

  const Q = scalarMultiply(d, G);
  return {
    privateKey: d.toString(16).padStart(64, '0'),
    publicKey: encodePoint(Q),
  };
}

/**
 * Encrypts a UTF-8 string under a recipient's secp256k1 public key using ECIES.
 *
 * SEC 1 §5.1. The produced bundle must be passed intact to decrypt() —
 * any modification to the ciphertext or mac fields will cause MAC_MISMATCH.
 *
 * @param plaintext          - The UTF-8 message to encrypt
 * @param recipientPublicKey - The recipient's ECC public key ('x,y' hex)
 */
export function encrypt(plaintext: string, recipientPublicKey: string): ECIESCiphertext {
  const Q = decodePoint(recipientPublicKey);
  const plaintextBuf = Buffer.from(plaintext, 'utf8');

  // Step 1: generate ephemeral keypair (r, R=r*G)
  let r: bigint;
  do {
    r = BigInt(`0x${crypto.randomBytes(32).toString('hex')}`);
  } while (r === 0n || r >= N);
  const R = scalarMultiply(r, G);

  // Step 2: derive shared secret S = r * Q_recipient
  const S = scalarMultiply(r, Q);
  if (S === 'infinity') throw new Error('ECIES: shared point is infinity during encrypt');

  // Step 3: expand MAC key (counter=0) and cipher keystream (counter>=1) independently
  const macKey = deriveMacKey(S);
  const keystream = deriveKeystream(S, plaintextBuf.length);

  // Step 4: XOR keystream with plaintext
  const ciphertextBuf = Buffer.alloc(plaintextBuf.length);
  for (let i = 0; i < plaintextBuf.length; i++) {
    ciphertextBuf[i] = plaintextBuf[i] ^ keystream[i];
  }

  // Step 5: compute integrity tag over raw ciphertext bytes
  const mac = computeMac(macKey, ciphertextBuf);

  return {
    ephemeralPublicKey: encodePoint(R),
    ciphertext: ciphertextBuf.toString('hex'),
    mac,
  };
}

/**
 * Decrypts an ECIES bundle produced by encrypt() using the recipient's private key.
 *
 * SEC 1 §5.1. MAC verification is performed before decryption — the function
 * returns MAC_MISMATCH immediately if the tag is invalid, without decrypting.
 *
 * Returns a typed DecryptResult; callers must check result.ok before reading
 * result.plaintext. Never throws on expected crypto failures.
 *
 * @param bundle     - The ECIESCiphertext bundle from encrypt()
 * @param privateKey - The recipient's private key scalar as a hex string
 */
export function decrypt(bundle: ECIESCiphertext, privateKey: string): DecryptResult {
  try {
    if (!bundle.ephemeralPublicKey || !bundle.ciphertext || !bundle.mac) {
      return { ok: false, error: 'INVALID_INPUT' };
    }

    const d = BigInt(`0x${privateKey}`);
    const R = decodePoint(bundle.ephemeralPublicKey);
    const ciphertextBuf = Buffer.from(bundle.ciphertext, 'hex');

    // Re-derive shared secret: S' = d * R  (equals r * Q by ECDH commutativity)
    const S = scalarMultiply(d, R);
    if (S === 'infinity') return { ok: false, error: 'POINT_AT_INFINITY' };

    // Re-derive MAC key and verify the integrity tag in constant time before decrypting
    const macKey = deriveMacKey(S);
    const expectedMac = computeMac(macKey, ciphertextBuf);
    const expectedBuf = Buffer.from(expectedMac, 'hex');
    const actualBuf = Buffer.from(bundle.mac, 'hex');

    if (expectedBuf.length !== actualBuf.length) {
      return { ok: false, error: 'MAC_MISMATCH' };
    }

    // timingSafeEqual prevents timing side-channel on the MAC comparison
    if (!crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      return { ok: false, error: 'MAC_MISMATCH' };
    }

    // MAC is valid — decrypt by XORing ciphertext with the re-derived keystream
    const keystream = deriveKeystream(S, ciphertextBuf.length);
    const plaintextBuf = Buffer.alloc(ciphertextBuf.length);
    for (let i = 0; i < ciphertextBuf.length; i++) {
      plaintextBuf[i] = ciphertextBuf[i] ^ keystream[i];
    }

    return { ok: true, plaintext: plaintextBuf.toString('utf8') };
  } catch {
    return { ok: false, error: 'INVALID_INPUT' };
  }
}

/**
 * Convenience wrapper: decrypt and return the plaintext string, or a fallback.
 *
 * Prefer the full decrypt() when you need to distinguish error codes.
 * This wrapper is appropriate for display-layer code that should degrade
 * gracefully (e.g., showing "[Encrypted]" when a key is unavailable).
 *
 * @param bundle     - The ECIESCiphertext bundle from encrypt()
 * @param privateKey - The recipient's private key scalar as a hex string
 * @param fallback   - Value returned when decryption fails for any reason
 */
export function decryptOrFallback(
  bundle: ECIESCiphertext,
  privateKey: string,
  fallback: string = '',
): string {
  const result = decrypt(bundle, privateKey);
  return result.ok ? result.plaintext : fallback;
}


