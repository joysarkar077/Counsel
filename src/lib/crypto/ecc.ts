import crypto from 'crypto';

/**
 * secp256k1 curve parameters (SEC 2 §2.4.1).
 * These are spec-fixed constants — do not rename.
 */
const P = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F');
const A = 0n;
const B = 7n;
const Gx = BigInt('0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798');
const Gy = BigInt('0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8');
const N = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

/** An affine point on the curve, or the point at infinity. */
type Point = { x: bigint; y: bigint } | 'infinity';

/** ECC key pair: private scalar and uncompressed public point. */
export interface ECCKeyPair {
  /** Private key as hex string */
  privateKey: string;
  /** Public key as 'x,y' hex string pair */
  publicKey: string;
}

/**
 * ECIES ciphertext bundle.
 * Stores the ephemeral public key, XOR-encrypted ciphertext, and a HMAC-SHA256
 * integrity tag over the ciphertext bytes (keyed on the ECDH shared secret).
 *
 * SEC 1 §5.1 — ECIES with ANSI X9.63 KDF and HMAC-SHA256 integrity tag.
 */
export interface ECIESCiphertext {
  /** Ephemeral public key R = r·G, as 'x,y' hex */
  ephemeralPublicKey: string;
  /** XOR-encrypted ciphertext as hex */
  ciphertext: string;
  /**
   * HMAC-SHA256 integrity tag — computed as:
   *   HMAC(sharedSecretX_bytes, ciphertextHex_utf8)
   * where sharedSecretX_bytes is the 32-byte big-endian x-coordinate of S.
   * Verifying this before decryption prevents padding oracle and chosen-ciphertext attacks.
   */
  mac: string;
}

/** Typed result for decrypt() — avoids leaking crypto error details to callers. */
export type DecryptResult =
  | { ok: true; plaintext: string }
  | { ok: false; error: 'MAC_MISMATCH' | 'POINT_AT_INFINITY' | 'INVALID_INPUT' };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Modular exponentiation: base^exp mod mod. */
function modpow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base = ((base % mod) + mod) % mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
  }
  return result;
}

/** Modular inverse via Fermat's little theorem (P is prime). */
function modInvP(a: bigint): bigint {
  return modpow(a, P - 2n, P);
}

/**
 * Elliptic curve point addition over secp256k1.
 * SEC 1 §2.2.1 — point addition formula.
 */
function pointAdd(P1: Point, P2: Point): Point {
  if (P1 === 'infinity') return P2;
  if (P2 === 'infinity') return P1;

  if (P1.x === P2.x) {
    // Either point doubling or additive inverses (sum = infinity)
    if (P1.y !== P2.y) return 'infinity';
    return pointDouble(P1);
  }

  const lambda = (((P2.y - P1.y) % P) * modInvP((P2.x - P1.x + P) % P)) % P;
  const x3 = ((lambda * lambda - P1.x - P2.x) % P + P) % P;
  const y3 = ((lambda * (P1.x - x3) - P1.y) % P + P) % P;
  return { x: x3, y: y3 };
}

/**
 * Elliptic curve point doubling over secp256k1.
 * SEC 1 §2.2.1 — point doubling formula, tangent line method.
 */
function pointDouble(pt: Point): Point {
  if (pt === 'infinity') return 'infinity';

  // Tangent slope: lambda = (3x² + a) / (2y)  — a=0 for secp256k1
  const lambda = ((3n * pt.x * pt.x * modInvP((2n * pt.y) % P)) % P + P) % P;
  const x3 = ((lambda * lambda - 2n * pt.x) % P + P) % P;
  const y3 = ((lambda * (pt.x - x3) - pt.y) % P + P) % P;
  return { x: x3, y: y3 };
}

/**
 * Scalar multiplication: k·P using double-and-add.
 * SEC 1 §2.2.1.
 */
function scalarMultiply(k: bigint, pt: Point): Point {
  let result: Point = 'infinity';
  let addend: Point = pt;
  while (k > 0n) {
    if (k & 1n) result = pointAdd(result, addend);
    addend = pointDouble(addend);
    k >>= 1n;
  }
  return result;
}

const G: Point = { x: Gx, y: Gy };

/** Encode a Point to a stable 'x,y' hex string. */
function encodePoint(pt: Point): string {
  if (pt === 'infinity') throw new Error('ECC: cannot encode point at infinity');
  return `${pt.x.toString(16)},${pt.y.toString(16)}`;
}

/** Decode a 'x,y' hex string back to a Point. */
function decodePoint(encoded: string): Point {
  const [xHex, yHex] = encoded.split(',');
  return { x: BigInt(`0x${xHex}`), y: BigInt(`0x${yHex}`) };
}

/**
 * Derive a keystream from a shared point S using hash-based expansion.
 * ANSI X9.63 KDF pattern — hash S concatenated with a 4-byte counter.
 *
 * Each 32-byte block: SHA-256(S_x_bytes || counter_4BE)
 */
function deriveKeystream(sharedPoint: Point, length: number): Buffer {
  if (sharedPoint === 'infinity') throw new Error('ECC: shared point is infinity');
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
 * Derive the MAC key from a shared point.
 * Uses a distinct counter (0) from the encryption keystream (counter ≥ 1)
 * so the MAC key is always independent from the cipher keystream.
 * ANSI X9.63 KDF §3.6.1 — counter 0 reserved for MAC derivation.
 */
function deriveMacKey(sharedPoint: Point): Buffer {
  if (sharedPoint === 'infinity') throw new Error('ECC: shared point is infinity for MAC');
  const sharedBytes = Buffer.from(sharedPoint.x.toString(16).padStart(64, '0'), 'hex');
  const counterBuf = Buffer.alloc(4); // counter = 0 for MAC key
  return crypto.createHash('sha256').update(sharedBytes).update(counterBuf).digest();
}

/**
 * Compute HMAC-SHA256 for integrity tagging.
 * Uses Node's built-in crypto.createHmac (not our scratch hmac.ts) to keep
 * this module framework/import-agnostic (ecc.ts may run in both Node and Edge).
 */
function computeMac(macKey: Buffer, ciphertextBuf: Buffer): string {
  return crypto.createHmac('sha256', macKey).update(ciphertextBuf).digest('hex');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates an ECC key pair on secp256k1.
 * Private key d is a random scalar in [1, N-1].
 * Public key Q = d·G.
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
 * ECIES encryption using secp256k1 with HMAC-SHA256 integrity tag.
 * SEC 1 §5.1 — generates an ephemeral keypair, derives shared secret via ECDH,
 * expands a keystream via ANSI X9.63 KDF, XORs with plaintext, then computes a MAC.
 *
 * The MAC key is derived from the same shared secret using counter=0,
 * while the cipher keystream uses counter≥1, ensuring independence.
 *
 * @param plaintext - UTF-8 string to encrypt
 * @param recipientPublicKey - hex 'x,y' public key of the recipient
 */
export function encrypt(plaintext: string, recipientPublicKey: string): ECIESCiphertext {
  const Q = decodePoint(recipientPublicKey);
  const plaintextBuf = Buffer.from(plaintext, 'utf8');

  // Generate ephemeral keypair (r, R)
  let r: bigint;
  do {
    r = BigInt(`0x${crypto.randomBytes(32).toString('hex')}`);
  } while (r === 0n || r >= N);
  const R = scalarMultiply(r, G);

  // Shared point S = r · Q_recipient
  const S = scalarMultiply(r, Q);
  if (S === 'infinity') throw new Error('ECC: shared point is infinity during encrypt');

  // Derive separate MAC key (counter=0) and cipher keystream (counter≥1)
  const macKey = deriveMacKey(S);
  const keystream = deriveKeystream(S, plaintextBuf.length);

  const ciphertextBuf = Buffer.alloc(plaintextBuf.length);
  for (let i = 0; i < plaintextBuf.length; i++) {
    ciphertextBuf[i] = plaintextBuf[i] ^ keystream[i];
  }

  // Integrity tag over the ciphertext bytes
  const mac = computeMac(macKey, ciphertextBuf);

  return {
    ephemeralPublicKey: encodePoint(R),
    ciphertext: ciphertextBuf.toString('hex'),
    mac,
  };
}

/**
 * ECIES decryption using secp256k1.
 * SEC 1 §5.1 — re-derives shared secret S = d · R, re-derives MAC key,
 * verifies the integrity tag in constant time, then decrypts.
 *
 * Returns a typed Result so callers can handle MAC_MISMATCH distinctly from
 * unexpected errors. Never throws on expected crypto failures.
 *
 * @param bundle - ciphertext bundle from encrypt()
 * @param privateKey - hex private key scalar of the recipient
 */
export function decrypt(bundle: ECIESCiphertext, privateKey: string): DecryptResult {
  try {
    if (!bundle.ephemeralPublicKey || !bundle.ciphertext || !bundle.mac) {
      return { ok: false, error: 'INVALID_INPUT' };
    }

    const d = BigInt(`0x${privateKey}`);
    const R = decodePoint(bundle.ephemeralPublicKey);
    const ciphertextBuf = Buffer.from(bundle.ciphertext, 'hex');

    // Shared point S' = d · R  (equals r · Q by ECDH)
    const S = scalarMultiply(d, R);
    if (S === 'infinity') return { ok: false, error: 'POINT_AT_INFINITY' };

    // Re-derive MAC key and verify integrity in constant time before decrypting
    const macKey = deriveMacKey(S);
    const expectedMac = computeMac(macKey, ciphertextBuf);
    const expectedBuf = Buffer.from(expectedMac, 'hex');
    const actualBuf = Buffer.from(bundle.mac, 'hex');

    if (expectedBuf.length !== actualBuf.length) {
      return { ok: false, error: 'MAC_MISMATCH' };
    }

    // crypto.timingSafeEqual prevents timing side-channel on MAC comparison
    if (!crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      return { ok: false, error: 'MAC_MISMATCH' };
    }

    // MAC is valid — now decrypt
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
 * Convenience wrapper: decrypt and return the plaintext, or a fallback string.
 * Use when you want to silently handle decryption failures without branching on Result.
 *
 * @param bundle - ciphertext bundle from encrypt()
 * @param privateKey - hex private key scalar
 * @param fallback - returned if decryption fails for any reason
 */
export function decryptOrFallback(
  bundle: ECIESCiphertext,
  privateKey: string,
  fallback: string = '',
): string {
  const result = decrypt(bundle, privateKey);
  return result.ok ? result.plaintext : fallback;
}

// ---------------------------------------------------------------------------
// ECDH scalar multiplication (exported for ECDSA in ecdsa.ts)
// ---------------------------------------------------------------------------

/**
 * Expose scalar multiply for use by ecdsa.ts.
 * Kept internal-only via naming convention — do not use outside crypto/.
 */
export function _scalarMultiply(k: bigint, pt: { x: bigint; y: bigint } | 'infinity'): typeof pt {
  return scalarMultiply(k, pt);
}
export function _pointAdd(
  p1: { x: bigint; y: bigint } | 'infinity',
  p2: { x: bigint; y: bigint } | 'infinity',
): typeof p1 {
  return pointAdd(p1, p2);
}
export { N as CURVE_N, P as CURVE_P, G as CURVE_G };
