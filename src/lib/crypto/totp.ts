/**
 * HOTP (RFC 4226) + TOTP (RFC 6238), from scratch.
 *
 * Uses HMAC-SHA256 (from ./hmac.ts) as the PRF instead of the spec's
 * default HMAC-SHA1 — our project standardizes on SHA-256 everywhere.
 * The dynamic-truncation and modular-reduction steps are identical to
 * RFC 4226 §5.3; only the underlying hash function differs.
 */

import { hmacSha256 } from './hmac';
import { constantTimeEqual } from './utils';

const DIGITS = 6;
const MODULO = 10 ** DIGITS; // 1_000_000

/**
 * Generates a one-time password per RFC 4226 §5.3 (HOTP).
 *
 * Steps:
 *   1. Encode counter as an 8-byte big-endian buffer.
 *   2. HS = HMAC-SHA256(secret, counter_bytes)          — 32 bytes
 *   3. offset = HS[31] & 0x0f                           — low 4 bits of last byte
 *   4. Sbits  = HS[offset..offset+3] & 0x7fffffff       — 31-bit unsigned int
 *   5. code   = Sbits mod 10^6, zero-padded to 6 digits
 *
 * @param secret  - Shared secret key
 * @param counter - Monotonically increasing 8-byte counter
 * @returns 6-digit OTP string (zero-padded)
 */
export function hotp(secret: Buffer, counter: number): string {
  // Step 1: encode counter as 8-byte big-endian
  const counterBuf = Buffer.alloc(8);
  // Write the counter into the low 8 bytes. JavaScript numbers are safe up
  // to 2^53, which is far beyond any realistic HOTP/TOTP counter value.
  const high = Math.floor(counter / 0x100000000);
  const low = counter >>> 0;
  counterBuf.writeUInt32BE(high, 0);
  counterBuf.writeUInt32BE(low, 4);

  // Step 2: HMAC
  const hs = hmacSha256(secret, counterBuf);

  // Step 3: dynamic truncation offset (RFC 4226 §5.3)
  const offset = hs[hs.length - 1] & 0x0f;

  // Step 4: extract 4 bytes at offset, mask MSB to get 31-bit unsigned int
  const binCode =
    ((hs[offset] & 0x7f) << 24) |
    ((hs[offset + 1] & 0xff) << 16) |
    ((hs[offset + 2] & 0xff) << 8) |
    (hs[offset + 3] & 0xff);

  // Step 5: reduce mod 10^6, zero-pad to 6 digits
  const otp = binCode % MODULO;
  return otp.toString().padStart(DIGITS, '0');
}

/**
 * Generates a time-based one-time password per RFC 6238 (TOTP).
 *
 * counter = floor(unix_epoch_seconds / timeStepSeconds)
 *
 * @param secret          - Shared secret key
 * @param timeStepSeconds - Time step in seconds (default 30)
 * @returns 6-digit OTP string
 */
export function totp(secret: Buffer, timeStepSeconds = 30): string {
  const counter = Math.floor(Date.now() / 1000 / timeStepSeconds);
  return hotp(secret, counter);
}

/**
 * Verifies a TOTP code, allowing ±driftWindow time steps to tolerate
 * minor clock skew between client and server.
 *
 * Each candidate code is compared using constant-time equality to
 * prevent timing side-channel leaks.
 *
 * @param secret          - Shared secret key
 * @param code            - The 6-digit code supplied by the user
 * @param timeStepSeconds - Time step in seconds (default 30)
 * @param driftWindow     - Number of extra time steps to check in each direction (default 1)
 * @returns true if the code matches any counter in [current-drift, current+drift]
 */
export function verifyTotp(
  secret: Buffer,
  code: string,
  timeStepSeconds = 30,
  driftWindow = 1,
): boolean {
  const currentCounter = Math.floor(Date.now() / 1000 / timeStepSeconds);
  const codeBuf = Buffer.from(code, 'utf-8');

  // Always evaluate every candidate to avoid timing leaks on which
  // window position matched.
  let isValid = false;
  for (let i = -driftWindow; i <= driftWindow; i++) {
    const candidate = hotp(secret, currentCounter + i);
    const candidateBuf = Buffer.from(candidate, 'utf-8');

    if (codeBuf.length === candidateBuf.length && constantTimeEqual(codeBuf, candidateBuf)) {
      isValid = true;
    }
  }

  return isValid;
}
