'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { decrypt, encrypt } from '@/lib/crypto/rsa';

interface LawyerClientAssignerProps {
  caseId: string;
  lawyerId: string;
  encryptedCaseKey: string;
  privateKey: any;
}

interface ClientUser {
  _id: string;
  fullName?: string;
  email: string;
  publicKey: string;
}

export function LawyerClientAssigner({ caseId, lawyerId, encryptedCaseKey, privateKey }: LawyerClientAssignerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [clients, setClients] = useState<ClientUser[]>([]);
  
  // Selection State
  const [selectedClientId, setSelectedClientId] = useState('');
  
  // Creation State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  
  // Global State
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchClients = async () => {
      try {
        const res = await fetch('/api/lawyer/clients');
        const json = await res.json();
        if (json.success) {
          setClients(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch clients', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const executeAssignment = async (targetClientId: string, latestClients?: ClientUser[]) => {

    if (!privateKey) {
      alert('Private key not found in session. Please log in again.');
      return;
    }

    setLoading(true);

    try {
      const activeClients = latestClients || clients;
      // 1. Find the selected client's public key
      const client = activeClients.find(c => c._id === targetClientId);
      if (!client || !client.publicKey) {
        throw new Error('Client public key not found in the list. Please try again.');
      }

      // 2. Decrypt the AES Case Key using the lawyer's private key
      let aesKeyHex: string;
      try {
        aesKeyHex = decrypt(encryptedCaseKey, privateKey);
      } catch (err) {
        throw new Error('Failed to decrypt the case key using your credentials.');
      }

      // 3. Re-encrypt the AES Case Key using the target client's public key
      const clientPubKey = JSON.parse(client.publicKey);
      const newEncryptedCaseKey = encrypt(aesKeyHex, clientPubKey);

      // 4. Send it to the server
      const res = await fetch(`/api/cases/${caseId}/client`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: targetClientId,
          encryptedCaseKey: newEncryptedCaseKey
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to assign client');
      }

      alert('Client successfully connected to the case!');
      setIsOpen(false);
      router.refresh(); // Reload the page to reflect the new client
      
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedClientId) return;
    await executeAssignment(selectedClientId);
  };

  const handleCreateAndAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    setLoading(true);
    try {
      // Auto-generate a secure random placeholder password for the ghost account
      // Since they are in lockup, they don't need a password right now.
      const ghostPassword = crypto.randomUUID();

      // 1. Register the new client
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newName,
          email: newEmail,
          password: ghostPassword,
          role: 'client'
        })
      });

      const regJson = await regRes.json();
      if (!regRes.ok) throw new Error(regJson.error || 'Failed to register client');

      // 2. Fetch the updated clients list so we get their new public key
      const fetchRes = await fetch('/api/lawyer/clients');
      const fetchJson = await fetchRes.json();
      if (!fetchJson.success) throw new Error('Failed to fetch updated client list');
      
      setClients(fetchJson.data);

      // 3. Find the newly created client in the list using the ID returned from registration
      const newClientId = regJson.data?.id;
      if (!newClientId) throw new Error('Registration succeeded but no ID was returned.');

      const newClient = fetchJson.data.find((c: ClientUser) => c._id === newClientId);
      if (!newClient) throw new Error('Could not find the newly created client in the database.');

      setSelectedClientId(newClient._id);

      // 4. Execute the assignment using the freshly fetched array!
      await executeAssignment(newClient._id, fetchJson.data);

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'An error occurred during client creation.');
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-sm text-slate-500 animate-pulse">Loading clients...</div>;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full rounded-md bg-navy-core px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-navy-core/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-core transition-colors flex items-center justify-center gap-2"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Client
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900">
                Connect Client to Case
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-500 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-5">
              {/* Mode Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${mode === 'select' ? 'bg-white text-navy-core shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setMode('select')}
                >
                  Select Existing
                </button>
                <button
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${mode === 'create' ? 'bg-white text-navy-core shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setMode('create')}
                >
                  Create New
                </button>
              </div>

              {mode === 'select' ? (
                <div className="flex flex-col gap-4">
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-navy-core focus:outline-none focus:ring-1 focus:ring-navy-core disabled:opacity-50"
                  >
                    <option value="">-- Select a Client --</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.fullName || `Client (${c._id.slice(-4)})`}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleAssign}
                    disabled={!selectedClientId || loading}
                    className="w-full rounded-lg bg-navy-core px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-navy-core/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-core disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Encrypting & Assigning...' : 'Connect Client'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateAndAssign} className="flex flex-col gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-navy-core focus:outline-none focus:ring-1 focus:ring-navy-core disabled:opacity-50"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-navy-core focus:outline-none focus:ring-1 focus:ring-navy-core disabled:opacity-50"
                    required
                  />
                  
                  <button
                    type="submit"
                    disabled={!newName || !newEmail || loading}
                    className="w-full rounded-lg bg-navy-core px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-navy-core/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-core disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Creating & Encrypting...' : 'Create & Connect'}
                  </button>
                </form>
              )}
              
              <div className="rounded-lg bg-slate-50 p-3 mt-2">
                <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  Client will automatically receive an E2EE encrypted key.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
