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

/** ECIES ciphertext bundle. */
export interface ECIESCiphertext {
  /** Ephemeral public key R = r·G, as 'x,y' hex */
  ephemeralPublicKey: string;
  /** XOR-encrypted ciphertext as hex */
  ciphertext: string;
}

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
 * Derive a keystream from a shared point S using hash-based expansion
 * (ANSI X9.63 KDF pattern — hash S concatenated with a 4-byte counter).
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
 * ECIES encryption using secp256k1.
 * SEC 1 §5.1 — generates an ephemeral keypair, derives shared secret via ECDH,
 * expands a keystream, and XORs with plaintext.
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
  const keystream = deriveKeystream(S, plaintextBuf.length);

  const ciphertextBuf = Buffer.alloc(plaintextBuf.length);
  for (let i = 0; i < plaintextBuf.length; i++) {
    ciphertextBuf[i] = plaintextBuf[i] ^ keystream[i];
  }

  return {
    ephemeralPublicKey: encodePoint(R),
    ciphertext: ciphertextBuf.toString('hex'),
  };
}

/**
 * ECIES decryption using secp256k1.
 * SEC 1 §5.1 — re-derives shared secret S = d · R, expands identical keystream,
 * and XORs with ciphertext to recover plaintext.
 *
 * @param bundle - ciphertext bundle from encrypt()
 * @param privateKey - hex private key scalar of the recipient
 */
export function decrypt(bundle: ECIESCiphertext, privateKey: string): string {
  const d = BigInt(`0x${privateKey}`);
  const R = decodePoint(bundle.ephemeralPublicKey);
  const ciphertextBuf = Buffer.from(bundle.ciphertext, 'hex');

  // Shared point S' = d · R  (equals r · Q by ECDH)
  const S = scalarMultiply(d, R);
  const keystream = deriveKeystream(S, ciphertextBuf.length);

  const plaintextBuf = Buffer.alloc(ciphertextBuf.length);
  for (let i = 0; i < ciphertextBuf.length; i++) {
    plaintextBuf[i] = ciphertextBuf[i] ^ keystream[i];
  }

  return plaintextBuf.toString('utf8');
}
