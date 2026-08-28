import { RSAPublicKey, verify } from './rsa';

/**
 * State-Change Verification
 * Ensures that critical state changes (like a case status update) were 
 * genuinely signed by an authorized user.
 */
export function verifyStateChange(
  oldState: string,
  newState: string,
  signatureHex: string,
  userPublicKey: RSAPublicKey
): boolean {
  // Construct the canonical message that was signed
  const message = `STATE_CHANGE|${oldState}|${newState}`;
  
  // Verify using Person A's RSA verify function
  return verify(message, signatureHex, userPublicKey);
}
