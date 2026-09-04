'use client';

import { useState, useEffect } from 'react';
import { decrypt } from '@/lib/crypto/rsa';
import { encryptText, decryptText, importAESKey } from '@/lib/crypto/textCrypto';
import { UploadDropzone } from '@/utils/uploadthing';

interface Attachment {
  name: string;
  url: string;
  key: string;
}

interface CaseNote {
  _id: string;
  authorId: string;
  authorRole: string;
  content_enc: string;
  attachments: Attachment[];
  createdAt: string;
  // Decrypted content
  content?: string;
}

interface NotesTabProps {
  caseId: string;
  accessKeys?: any[];
  userId?: string;
  userRole?: 'lawyer' | 'client' | 'admin' | 'super_admin';
}

export function NotesTab({ caseId, accessKeys, userId, userRole }: NotesTabProps) {
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNotes();
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
      console.error('Failed to get AES key for notes', e);
      return null;
    }
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cases/${caseId}/notes`);
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      
      const aesKey = await getAESKey();
      
      const decryptedNotes = await Promise.all(
        data.data.map(async (n: CaseNote) => {
          let dc = 'Encrypted Note Content';
          if (aesKey) {
            try {
              const parsed = JSON.parse(n.content_enc);
              dc = await decryptText(parsed.ciphertextHex, parsed.ivHex, aesKey);
            } catch (e) {
              console.error('Decryption failed for note', e);
            }
          }
          return { ...n, content: dc };
        })
      );
      
      setNotes(decryptedNotes);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && attachments.length === 0) return;

    try {
      setSubmitting(true);
      const aesKey = await getAESKey();
      if (!aesKey) throw new Error('Cannot encrypt note without case key');

      // Encrypt content
      const encC = await encryptText(content || 'No text content provided.', aesKey);
      const content_enc = JSON.stringify({ ciphertextHex: encC.ciphertextHex, ivHex: encC.ivHex });

      const res = await fetch(`/api/cases/${caseId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_enc,
          attachments,
        }),
      });

      if (!res.ok) throw new Error('Failed to save note');
      
      setContent('');
      setAttachments([]);
      fetchNotes();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {userRole && userRole !== 'admin' && userRole !== 'super_admin' && (
        <form onSubmit={handleSubmit} className="bg-bg-page border border-border p-5 rounded-xl space-y-4">
          <h3 className="text-sm font-semibold text-navy-deepest tracking-tight mb-2">Add a Note or File</h3>
          <div>
            <textarea 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              placeholder="Write a securely encrypted note here..." 
              rows={3} 
              className="w-full text-sm rounded-lg border border-border bg-white px-3 py-2"
            />
          </div>
          
          <div className="bg-white rounded-lg border border-border p-3">
            <UploadDropzone
              endpoint="caseAttachment"
              headers={{
                'x-user-id': userId || ''
              }}
              onClientUploadComplete={(res) => {
                const newAtt = res.map(f => ({ name: f.name, url: f.url, key: f.key }));
                setAttachments(prev => [...prev, ...newAtt]);
                alert('Files uploaded successfully! They will be attached to this note once you save.');
              }}
              onUploadError={(error: Error) => {
                alert(`ERROR! ${error.message}`);
              }}
            />
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase">Attached to this draft:</p>
                <ul className="text-sm space-y-1">
                  {attachments.map((att, i) => (
                    <li key={i} className="flex items-center text-blue-600 gap-1.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      {att.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button type="submit" disabled={submitting || (!content.trim() && attachments.length === 0)} className="w-full text-sm bg-navy-core text-white font-medium py-2.5 rounded-lg hover:bg-navy-dark transition-colors disabled:opacity-50">
            {submitting ? 'Encrypting & Saving...' : 'Save Note & Attachments'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-text-muted">Loading notes...</div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-red-500">{error}</div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border bg-bg-page">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 h-10 w-10 text-text-muted" aria-hidden>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p className="text-sm font-semibold text-text-secondary">No notes or files yet</p>
          <p className="mt-1 text-xs text-text-muted max-w-xs">
            Notes and files for this case will appear here. Note content is AES-encrypted at rest.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((n) => (
            <div key={n._id} className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${n.authorRole === 'lawyer' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                    {n.authorRole === 'lawyer' ? 'Attorney' : 'Client'}
                  </span>
                </div>
                <time className="text-xs text-slate-500 font-medium">
                  {new Date(n.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </time>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.content}</p>
              
              {n.attachments && n.attachments.length > 0 && (
                <div className="mt-2 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  {n.attachments.map((att, i) => (
                    <a 
                      key={i} 
                      href={att.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      <span className="truncate max-w-[150px]">{att.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
