'use client';

import { useState, useEffect } from 'react';
import { decrypt, encrypt } from '@/lib/crypto/rsa';

interface AdminClientAssignerProps {
  caseId: string;
  adminId: string;
  encryptedCaseKey: string; // The admin's copy of the AES key
}

export function AdminClientAssigner({ caseId, adminId, encryptedCaseKey }: AdminClientAssignerProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setClients(data.data.filter((u: any) => u.role === 'client'));
        }
      })
      .catch(err => console.error('Failed to fetch clients', err));
  }, []);

  const handleAssign = async () => {
    if (!clientId) return;
    setStatus('loading');
    setErrorMessage('');

    try {
      // 1. Fetch Client's public key (already included in the users array from /api/admin/users)
      const client = clients.find(c => c.id === clientId);
      if (!client || !client.publicKey) {
        throw new Error('Client public key not found');
      }

      // 2. Fetch Admin's private key from session memory
      const adminPrivateKey = (window as any).sessionPrivateKey;
      if (!adminPrivateKey) {
        throw new Error('Admin private key not found in session memory. Please re-login.');
      }

      // 3. Decrypt the AES key using Admin's private key
      let aesKeyHex: string;
      try {
        aesKeyHex = decrypt(encryptedCaseKey, adminPrivateKey);
      } catch (err) {
        throw new Error('Failed to decrypt the case key using your credentials.');
      }

      // 4. Encrypt the AES key using Client's public key
      const clientPubKey = JSON.parse(client.publicKey);
      const newEncryptedCaseKey = encrypt(aesKeyHex, clientPubKey);

      // 5. Submit assignment
      const assignRes = await fetch(`/api/cases/${caseId}/client`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          encryptedCaseKey: newEncryptedCaseKey
        })
      });

      const assignJson = await assignRes.json();
      if (!assignRes.ok || !assignJson.success) {
        throw new Error(assignJson.error || 'Failed to assign client');
      }

      setStatus('success');
      // Refresh page to show the new client
      window.location.reload();
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
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled={status === 'loading'}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-core bg-white text-slate-900"
          >
            <option value="">-- Select a Client --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.email ? `(${c.email})` : ''}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAssign}
          disabled={status === 'loading' || !clientId}
          className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white rounded-md font-medium disabled:opacity-50 hover:bg-slate-800 transition-colors"
        >
          {status === 'loading' ? 'Assigning...' : 'Assign Client'}
        </button>
      </div>

      {status === 'error' && <p className="text-sm text-red-500">{errorMessage}</p>}
      {status === 'success' && <p className="text-sm text-green-600">Client successfully assigned!</p>}
    </div>
  );
}
