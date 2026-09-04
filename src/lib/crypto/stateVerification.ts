import { sign, verify, RSAPrivateKey, RSAPublicKey } from './rsa';

/**
 * Creates a standard format string for a case state transition.
 */
export function buildStateMessage(caseId: string, oldState: string, newState: string, timestamp: number): string {
  return `STATE_CHANGE|${caseId}|${oldState}|${newState}|${timestamp}`;
}

/**
 * Signs a case state transition to ensure non-repudiation.
 * The lawyer/admin proving they made the change must provide their private key.
 * 
 * @param caseId - The ID of the case being updated
 * @param oldState - The previous state (e.g., 'ACTIVE')
 * @param newState - The new state (e.g., 'CLOSE_REQUESTED')
 * @param privateKey - The user's decrypted RSA private key
 * @returns { signatureHex, timestamp }
 */
export async function signStateTransition(
  caseId: string,
  oldState: string,
  newState: string,
  privateKey: RSAPrivateKey
): Promise<{ signatureHex: string; timestamp: number }> {
  const timestamp = Date.now();
  const message = buildStateMessage(caseId, oldState, newState, timestamp);
  const signatureHex = await sign(message, privateKey);
  
  return { signatureHex, timestamp };
}

/**
 * Verifies that a state transition was genuinely authorized by the owner of the public key.
 * Used by the backend before applying the state change to the database.
 * 
 * @param caseId - The ID of the case
 * @param oldState - The expected previous state
 * @param newState - The requested new state
 * @param timestamp - When the signature was created
 * @param signatureHex - The provided RSA signature
 * @param publicKey - The public key of the user who supposedly made the change
 * @returns true if the signature is valid for this exact transition
 */
export async function verifyStateTransition(
  caseId: string,
  oldState: string,
  newState: string,
  timestamp: number,
  signatureHex: string,
  publicKey: RSAPublicKey
): Promise<boolean> {
  const message = buildStateMessage(caseId, oldState, newState, timestamp);
  return await verify(message, signatureHex, publicKey);
}
