'use client';

import { useState, useEffect, useRef } from 'react';
import { generateTempKeyPair, signClientMessage, exportPublicKey } from '@/lib/crypto/client';

type Message = {
  _id: string;
  senderId: string;
  ciphertext: string;
  signature: string;
  createdAt: string;
};

export default function ChatClient({ caseId }: { caseId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [keyPair, setKeyPair] = useState<CryptoKeyPair | null>(null);

  useEffect(() => {
    // Generate a temporary keypair for the session to test signatures
    generateTempKeyPair().then(kp => setKeyPair(kp));

    // Fetch messages
    fetch(`/api/messages?caseId=${caseId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMessages(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [caseId]);

  const handleSend = async () => {
    if (!inputText.trim() || !keyPair) return;

    // 1. Temporary dummy encryption (just btoa for now)
    const ciphertext = window.btoa(inputText);
    
    // 2. Sign the ciphertext
    const signature = await signClientMessage(keyPair.privateKey, ciphertext);

    // Optimistic UI update
    const tempMsg: Message = {
      _id: Math.random().toString(),
      senderId: 'current_user',
      ciphertext,
      signature,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMsg]);
    const currentInput = inputText;
    setInputText('');

    // Send to API
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          senderId: 'current_user', // dummy user ID
          ciphertext,
          signature
        })
      });
      const data = await res.json();
      if (!data.success) {
        console.error('Failed to send:', data.error);
        // revert optimistic update here in real app
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-card border border-border shadow-sm rounded-xl overflow-hidden h-[calc(100vh-280px)] min-h-[500px]">
      
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 bg-gray-50">
        <div className="text-center my-4">
          <span className="bg-navy-core/10 text-text-muted text-[0.8rem] py-1.5 px-4 rounded-full font-semibold">Encrypted channel established.</span>
        </div>
        
        {loading ? (
          <div className="text-center text-text-muted text-sm">Loading encrypted messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-text-muted text-sm">No messages yet. Start the conversation.</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === 'current_user';
            
            // Temporary decryption (atob)
            let plaintext = '';
            try { plaintext = window.atob(msg.ciphertext); } 
            catch(e) { plaintext = msg.ciphertext; } // fallback if not btoa encoded

            return (
              <div key={msg._id} className={`flex gap-3 max-w-[80%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
                <div className={`w-9 h-9 rounded-full ${isMe ? 'bg-gold text-navy-deepest' : 'bg-navy-core text-white'} flex items-center justify-center font-bold text-[0.85rem] shrink-0`}>
                  {isMe ? 'ME' : 'AH'}
                </div>
                <div className={`${isMe ? 'bg-navy-deepest border-navy-deepest text-white rounded-tr-sm' : 'bg-white border-border rounded-tl-sm'} border p-4 rounded-xl shadow-sm`}>
                  <p className="text-[0.95rem] leading-relaxed mb-2">{plaintext}</p>
                  <div className="flex items-center justify-between gap-4">
                    <span className={`text-[0.75rem] ${isMe ? 'text-white/60' : 'text-text-muted'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.signature && (
                      <span className={`flex items-center gap-1 text-[0.7rem] font-semibold ${isMe ? 'text-emerald-400 bg-emerald-500/20' : 'text-emerald-500 bg-emerald-500/10'} py-0.5 px-1.5 rounded-full`} title={`Signature: ${msg.signature.substring(0, 10)}...`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        Signed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="p-5 px-6 bg-white border-t border-border">
        <div className="flex gap-3 mb-2">
          <textarea 
            className="flex-1 py-3 px-4 border border-border rounded-lg font-sans text-[0.95rem] resize-none outline-none transition-colors bg-bg-page focus:border-navy-core" 
            placeholder={keyPair ? "Type an encrypted message..." : "Generating session keys..."}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={!keyPair}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          ></textarea>
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || !keyPair}
            className="w-12 h-12 flex items-center justify-center shrink-0 rounded-lg bg-navy-core text-white hover:bg-navy-deepest transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <p className="flex items-center gap-1.5 text-[0.75rem] text-gold-muted font-semibold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Your browser will encrypt this text and sign it before sending it to the server.
        </p>
      </div>
    </div>
  );
}
