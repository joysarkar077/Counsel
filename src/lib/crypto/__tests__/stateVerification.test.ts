import { strict as assert } from 'assert';
import { test, describe } from 'node:test';
import { generateKeyPair } from '../rsa';
import { signStateTransition, verifyStateTransition, buildStateMessage } from '../stateVerification';

// Small key for faster testing
const keyPair = generateKeyPair(512);

describe('State Verification', () => {
  test('valid signature verifies correctly', () => {
    const caseId = 'case_123';
    const oldState = 'ACTIVE';
    const newState = 'CLOSE_REQUESTED';

    // User signs the change on the client
    const { signatureHex, timestamp } = signStateTransition(caseId, oldState, newState, keyPair.privateKey);

    // Server verifies it
    const isValid = verifyStateTransition(caseId, oldState, newState, timestamp, signatureHex, keyPair.publicKey);
    assert.equal(isValid, true);
  });

  test('tampering with the state fails verification', () => {
    const caseId = 'case_123';
    
    // User signs one thing
    const { signatureHex, timestamp } = signStateTransition(caseId, 'ACTIVE', 'CLOSE_REQUESTED', keyPair.privateKey);

    // Attacker tries to submit a different state using the same signature
    const isValid = verifyStateTransition(caseId, 'ACTIVE', 'CLOSED', timestamp, signatureHex, keyPair.publicKey);
    assert.equal(isValid, false);
  });

  test('tampering with the caseId fails verification', () => {
    const { signatureHex, timestamp } = signStateTransition('case_123', 'ACTIVE', 'CLOSE_REQUESTED', keyPair.privateKey);

    // Replay attack on a different case
    const isValid = verifyStateTransition('case_999', 'ACTIVE', 'CLOSE_REQUESTED', timestamp, signatureHex, keyPair.publicKey);
    assert.equal(isValid, false);
  });

  test('signature from a different user fails', () => {
    const maliciousKeyPair = generateKeyPair(512);
    
    // Attacker signs it
    const { signatureHex, timestamp } = signStateTransition('case_123', 'ACTIVE', 'CLOSED', maliciousKeyPair.privateKey);

    // Server verifies against the expected lawyer's public key
    const isValid = verifyStateTransition('case_123', 'ACTIVE', 'CLOSED', timestamp, signatureHex, keyPair.publicKey);
    assert.equal(isValid, false);
  });
});
