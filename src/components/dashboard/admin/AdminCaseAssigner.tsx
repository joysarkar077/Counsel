'use client';

import { useState, useEffect } from 'react';
import { decrypt as decryptECIES, encrypt as encryptECIES, type ECIESCiphertext } from '@/lib/crypto/ecc';

interface AdminCaseAssignerProps {
  caseId: string;
  adminId: string;
  /** JSON-serialised ECIESCiphertext bundle containing the case ECC private scalar */
  encryptedCaseKey: string; 
}

export function AdminCaseAssigner({ caseId, adminId, encryptedCaseKey }: AdminCaseAssignerProps) {
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [lawyerId, setLawyerId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/lawyers')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLawyers(data.data);
        }
      })
      .catch(err => console.error('Failed to fetch lawyers', err));
  }, []);

  const handleAssign = async () => {
    if (!lawyerId) return;
    setStatus('loading');
    setErrorMessage('');

    try {
      // 1. Fetch Lawyer's public key (ECC secp256k1 public key)
      const pubKeyRes = await fetch(`/api/user/${lawyerId}/public-key`);
      const pubKeyJson = await pubKeyRes.json();
      
      if (!pubKeyRes.ok || !pubKeyJson.success) {
        throw new Error(pubKeyJson.error || 'Failed to fetch lawyer public key');
      }

      // 2. Fetch Admin's private key
      // For this prototype, we'll fetch it from the session memory (populated during login).
      // In a real Zero-Trust app, the Admin's private key is decrypted locally using a password.
      const adminPrivateKeyHex = (window as any).sessionPrivateKey;
      if (!adminPrivateKeyHex) {
        throw new Error('Admin private key not found in session memory. Please re-login.');
      }

      // 3. Decrypt the case scalar using Admin's private key (ECIES)
      const bundle: ECIESCiphertext = JSON.parse(encryptedCaseKey);
      const decryptResult = decryptECIES(bundle, adminPrivateKeyHex);
      if (!decryptResult.ok) {
        throw new Error('Failed to decrypt case key. You may not be authorized.');
      }
      const casePrivateKeyHex = decryptResult.plaintext;

      // 4. Encrypt the case scalar using Lawyer's public key (ECIES)
      const lawyerPubKeyHex = pubKeyJson.data.publicKey; // This should be the ECC hex string
      const newBundle = encryptECIES(casePrivateKeyHex, lawyerPubKeyHex);
      const newEncryptedCaseKey = JSON.stringify(newBundle);

      // 5. Submit assignment
      const assignRes = await fetch(`/api/cases/${caseId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lawyerId,
          encryptedCaseKey: newEncryptedCaseKey
        })
      });

      const assignJson = await assignRes.json();
      if (!assignRes.ok || !assignJson.success) {
        throw new Error(assignJson.error || 'Failed to assign lawyer');
      }

      setStatus('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during assignment');
      setStatus('error');
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col gap-3">
        <div className="flex-1">
          <select
            value={lawyerId}
            onChange={(e) => setLawyerId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-core bg-white text-slate-900"
          >
            <option value="">-- Select a Lawyer --</option>
            {lawyers.map(l => (
              <option key={l.id} value={l.id}>
                {l.name} (Dept: {l.department}, Active Cases: {l.activeCases})
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAssign}
          disabled={status === 'loading' || !lawyerId}
          className="w-full sm:w-auto px-4 py-2 bg-navy-core text-white rounded-md font-medium disabled:opacity-50 hover:bg-navy-core/90 transition-colors"
        >
          {status === 'loading' ? 'Assigning...' : 'Assign Attorney'}
        </button>
      </div>

      {status === 'error' && <p className="text-sm text-red-500">{errorMessage}</p>}
      {status === 'success' && <p className="text-sm text-green-600">Lawyer successfully assigned!</p>}
    </div>
  );
}
