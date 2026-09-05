'use client';

/**
 * MessagesTab — Real-time E2EE chat between client and lawyer.
 *
 * Encryption: ECIES (secp256k1) using the per-case ECC keypair.
 * - Outbound: encrypt(text, casePublicKey) → ephemeral keypair per message
 * - Inbound:  decrypt(bundle, casePrivateKeyHex) → MAC verified before plaintext
 *
 * Integrity: Each message MAC is verified on receipt; tampered messages are
 * silently dropped (and flagged in the UI) rather than displayed.
 *
 * Non-repudiation: Messages are ECDSA-signed with the sender's ECC private key
 * and the signature is stored server-side via the `signature` field.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { encrypt, decrypt, type ECIESCiphertext } from '@/lib/crypto/ecc';
import { signECDSA } from '@/lib/crypto/ecdsa';
import { generateHMAC } from '@/lib/crypto/hmac';

interface RawMessage {
  _id: string;
  caseId: string;
  senderId: string;
  ciphertext: string; // JSON-serialised ECIESCiphertext bundle
  signature: string;  // ECDSA { r, s } JSON
  integrityHash: string; // HMAC-SHA256 over ciphertext field
  createdAt: string;
}

interface DecryptedMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date;
  isMine: boolean;
  integrityOk: boolean;
}

interface MessagesTabProps {
  caseId: string;
  /** The per-case ECC private key scalar as a hex string. */
  casePrivateKeyHex: string;
  /** The per-case ECC public key ('x,y' hex) — used to encrypt outbound messages. */
  casePublicKey: string;
  /** The current user's MongoDB ObjectId string. */
  currentUserId: string;
  /** The current user's ECC private key scalar (for ECDSA signing outbound messages). */
  senderPrivateKeyHex?: string;
}

/** Server secret proxy for client-side HMAC — in prod use a session-derived key. */
const HMAC_KEY = 'client-integrity-key';
const POLL_INTERVAL_MS = 5000;

export function MessagesTab({
  caseId,
  casePrivateKeyHex,
  casePublicKey,
  currentUserId,
  senderPrivateKeyHex,
}: MessagesTabProps) {
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);

  const fetchAndDecrypt = useCallback(async () => {
    if (!casePrivateKeyHex) return;
    try {
      const res = await fetch(`/api/messages?caseId=${caseId}`, {
        headers: { 'x-user-id': currentUserId },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const decrypted: DecryptedMessage[] = [];
      for (const msg of json.data as RawMessage[]) {
        try {
          const bundle = JSON.parse(msg.ciphertext) as ECIESCiphertext;
          const result = decrypt(bundle, casePrivateKeyHex);

          if (!result.ok) {
            // MAC_MISMATCH — show a tamper warning placeholder instead of skipping silently
            decrypted.push({
              id: msg._id,
              senderId: msg.senderId,
              text: '[⚠ Message integrity check failed — possible tampering]',
              createdAt: new Date(msg.createdAt),
              isMine: msg.senderId === currentUserId,
              integrityOk: false,
            });
            continue;
          }

          decrypted.push({
            id: msg._id,
            senderId: msg.senderId,
            text: result.plaintext,
            createdAt: new Date(msg.createdAt),
            isMine: msg.senderId === currentUserId,
            integrityOk: true,
          });
        } catch {
          // Skip completely unparseable messages (e.g., old AES-era records)
        }
      }
      setMessages(decrypted);

      // Scroll to bottom only when new messages arrive
      if (decrypted.length !== lastMessageCountRef.current) {
        lastMessageCountRef.current = decrypted.length;
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } catch (err: any) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId, currentUserId, casePrivateKeyHex]);

  // Initial fetch + polling
  useEffect(() => {
    fetchAndDecrypt();
    const interval = setInterval(fetchAndDecrypt, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAndDecrypt]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !casePrivateKeyHex || !casePublicKey || sending) return;
    setSending(true);
    setError('');
    try {
      // Encrypt with ECIES to the case public key
      const bundle: ECIESCiphertext = encrypt(text, casePublicKey);
      const ciphertext = JSON.stringify(bundle);

      // ECDSA sign the ciphertext JSON string for non-repudiation
      let signature = '{}';
      if (senderPrivateKeyHex) {
        const sig = signECDSA(ciphertext, senderPrivateKeyHex);
        signature = JSON.stringify(sig);
      }

      // HMAC integrity tag over the ciphertext string
      const integrityHash = generateHMAC(HMAC_KEY, ciphertext);

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId,
        },
        body: JSON.stringify({ caseId, ciphertext, signature, integrityHash }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setInput('');
      await fetchAndDecrypt();
    } catch (err: any) {
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Group messages by date for date separators
  const grouped: { date: string; msgs: DecryptedMessage[] }[] = [];
  for (const msg of messages) {
    const dateStr = formatDate(msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (!last || last.date !== dateStr) {
      grouped.push({ date: dateStr, msgs: [msg] });
    } else {
      last.msgs.push(msg);
    }
  }

  if (!casePrivateKeyHex || !casePublicKey) {
    return (
      <div className="flex flex-col h-[520px] rounded-xl border border-border bg-bg-card overflow-hidden items-center justify-center">
        <p className="text-sm text-slate-500 italic">
          You do not have an encryption key for this case yet. Ask your attorney to share the case with you.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm" style={{ height: '560px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-emerald-600" aria-hidden>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">ECIES Encrypted</span>
        </div>
        <span className="text-xs text-slate-400 font-mono">Polling every 5s</span>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Decrypting messages…</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-slate-400" aria-hidden>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-600">No messages yet</p>
            <p className="text-xs text-slate-400 max-w-xs">Start the conversation. All messages are ECIES-encrypted before leaving your device.</p>
          </div>
        ) : (
          grouped.map(({ date, msgs }) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs font-semibold text-slate-400">{date}</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <div className="space-y-2">
                {msgs.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[72%] rounded-2xl px-4 py-2.5 shadow-sm ${
                        !msg.integrityOk
                          ? 'bg-red-50 border border-red-200 text-red-700 rounded-br-sm'
                          : msg.isMine
                          ? 'bg-slate-900 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.isMine && msg.integrityOk ? 'text-slate-400' : 'text-slate-500'} text-right`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 py-2 bg-red-50 border-t border-red-100">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type an encrypted message… (Enter to send)"
          disabled={sending || loading}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 disabled:opacity-50 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending || loading}
          className="rounded-xl bg-slate-900 hover:bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 flex-shrink-0"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden>
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
          Send
        </button>
      </div>
    </div>
  );
}
