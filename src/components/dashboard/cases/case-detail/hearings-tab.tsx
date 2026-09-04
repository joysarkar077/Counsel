'use client';

import { useState, useEffect } from 'react';
import { decrypt } from '@/lib/crypto/rsa';
import { encryptText, decryptText, importAESKey } from '@/lib/crypto/textCrypto';

interface Hearing {
  _id: string;
  date: string;
  title_enc: string;
  remarks_enc: string;
  createdBy: string;
  createdAt: string;
  // Decrypted values appended on client
  title?: string;
  remarks?: string;
}

interface HearingsTabProps {
  caseId: string;
  accessKeys?: any[];
  userId?: string;
  userRole?: 'lawyer' | 'client' | 'admin' | 'super_admin';
}

export function HearingsTab({ caseId, accessKeys, userId, userRole }: HearingsTabProps) {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state (Lawyers only)
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHearings();
  }, [caseId]);

  const getAESKey = async () => {
    if (!accessKeys || !userId) return null;
    const myAccess = accessKeys.find(ak => ak.userId === userId);
    if (!myAccess) return null;
    
    // @ts-ignore
    const privateKey = window.sessionPrivateKey;
    if (!privateKey) return null;

    try {
      const aesKeyHex = decrypt(myAccess.encryptedCaseKey, privateKey);
      return await importAESKey(aesKeyHex);
    } catch (e) {
      console.error('Failed to get AES key for hearings', e);
      return null;
    }
  };

  const fetchHearings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cases/${caseId}/hearings`);
      if (!res.ok) throw new Error('Failed to fetch hearings');
      const data = await res.json();
      
      const aesKey = await getAESKey();
      
      const decryptedHearings = await Promise.all(
        data.data.map(async (h: Hearing) => {
          let dt = 'Encrypted Title';
          let dr = 'Encrypted Remarks';
          if (aesKey) {
            try {
              const parsedT = JSON.parse(h.title_enc);
              dt = await decryptText(parsedT.ciphertextHex, parsedT.ivHex, aesKey);
              const parsedR = JSON.parse(h.remarks_enc);
              dr = await decryptText(parsedR.ciphertextHex, parsedR.ivHex, aesKey);
            } catch (e) {
              console.error('Decryption failed for hearing', e);
            }
          }
          return { ...h, title: dt, remarks: dr };
        })
      );
      
      setHearings(decryptedHearings);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;

    try {
      setSubmitting(true);
      const aesKey = await getAESKey();
      if (!aesKey) throw new Error('Cannot encrypt hearing without case key');

      // Encrypt title
      const encT = await encryptText(title, aesKey);
      const title_enc = JSON.stringify({ ciphertextHex: encT.ciphertextHex, ivHex: encT.ivHex });
      
      // Encrypt remarks
      const encR = await encryptText(remarks || 'No remarks provided.', aesKey);
      const remarks_enc = JSON.stringify({ ciphertextHex: encR.ciphertextHex, ivHex: encR.ivHex });

      const combinedDate = new Date(`${date}T${time}`);

      const res = await fetch(`/api/cases/${caseId}/hearings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: combinedDate.toISOString(),
          title_enc,
          remarks_enc
        }),
      });

      if (!res.ok) throw new Error('Failed to schedule hearing');
      
      setShowForm(false);
      setTitle('');
      setRemarks('');
      setDate('');
      setTime('');
      fetchHearings();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h3 className="text-lg font-semibold text-navy-deepest tracking-tight">Hearings Schedule</h3>
        {userRole === 'lawyer' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm bg-navy-core text-white px-4 py-2 rounded-lg font-medium hover:bg-navy-dark transition-colors"
          >
            {showForm ? 'Cancel' : 'Schedule Hearing'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-bg-page border border-border p-5 rounded-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Date</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full text-sm rounded-lg border border-border bg-white px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Time</label>
              <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="w-full text-sm rounded-lg border border-border bg-white px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Title / Subject</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Preliminary Hearing" className="w-full text-sm rounded-lg border border-border bg-white px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Remarks / Updates</label>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Encrypted notes for this hearing..." rows={3} className="w-full text-sm rounded-lg border border-border bg-white px-3 py-2"></textarea>
          </div>
          <button type="submit" disabled={submitting} className="w-full text-sm bg-blue-600 text-white font-medium py-2.5 rounded-lg disabled:opacity-50">
            {submitting ? 'Encrypting & Saving...' : 'Save Hearing'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-text-muted">Loading hearings...</div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-red-500">{error}</div>
      ) : hearings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border bg-bg-page">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 h-10 w-10 text-text-muted" aria-hidden>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p className="text-sm font-semibold text-text-secondary">No hearings scheduled</p>
          <p className="mt-1 text-xs text-text-muted max-w-xs">
            Hearings for case <code className="text-navy-core">{caseId.slice(-6)}</code> will appear here. The hearing records are AES-encrypted at rest.
          </p>
        </div>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {hearings.map((h, i) => {
            const hDate = new Date(h.date);
            const isPast = hDate < new Date();
            return (
              <div key={h._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-bg-card bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${isPast ? 'text-slate-400' : 'text-blue-500'}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-900 text-sm">{h.title}</h4>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isPast ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700'}`}>
                      {isPast ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                  <time className="block text-xs font-medium text-slate-500 mb-3">
                    {hDate.toLocaleDateString()} at {hDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </time>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{h.remarks}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
