import Link from 'next/link';

export default async function SecureChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div className="animate-fade-up h-full flex flex-col">
      <div className="mb-6 shrink-0">
        <div className="flex justify-between items-center mb-3">
          <Link href={`/dashboard/cases/${id}`} className="text-[0.9rem] font-semibold text-text-muted hover:text-navy-core transition-colors">&larr; Back to Case Details</Link>
          <div className="flex items-center gap-1.5 bg-gold/15 text-gold-muted text-[0.75rem] font-bold py-1 px-3 rounded-full uppercase">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            End-to-End Encrypted (secp256k1)
          </div>
        </div>
        <h1 className="text-[1.8rem] font-extrabold text-navy-deepest tracking-tight mb-1">Secure Chat: {id.toUpperCase()}</h1>
        <p className="text-[0.95rem] text-text-muted">Messages are encrypted with the recipient's public key and signed with your private key.</p>
      </div>

      <div className="flex-1 flex flex-col bg-bg-card border border-border shadow-sm rounded-xl overflow-hidden h-[calc(100vh-280px)] min-h-[500px]">
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 bg-gray-50">
          
          <div className="text-center my-4">
            <span className="bg-navy-core/10 text-text-muted text-[0.8rem] py-1.5 px-4 rounded-full font-semibold">Encrypted channel established.</span>
          </div>
          
          <div className="flex gap-3 max-w-[80%] self-start">
            <div className="w-9 h-9 rounded-full bg-navy-core text-white flex items-center justify-center font-bold text-[0.85rem] shrink-0">AH</div>
            <div className="bg-white border border-border p-4 rounded-xl rounded-tl-sm shadow-sm">
              <p className="text-[0.95rem] leading-relaxed mb-2">Hello Mr. Sarkar, I've reviewed the initial case filing you submitted. Could you please upload the original patent document for my review?</p>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[0.75rem] text-text-muted">10:45 AM</span>
                <span className="flex items-center gap-1 text-[0.7rem] font-semibold text-emerald-500 bg-emerald-500/10 py-0.5 px-1.5 rounded-full" title="RSA Signature Verified">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Signed
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 max-w-[80%] self-end flex-row-reverse">
            <div className="bg-navy-deepest border border-navy-deepest text-white p-4 rounded-xl rounded-tr-sm shadow-sm">
              <p className="text-[0.95rem] leading-relaxed mb-2">Sure Adv. Anisul, I will encrypt it and upload it to the case files section right away.</p>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[0.75rem] text-white/60">10:48 AM</span>
                <span className="flex items-center gap-1 text-[0.7rem] font-semibold text-emerald-400 bg-emerald-500/20 py-0.5 px-1.5 rounded-full">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Signed
                </span>
              </div>
            </div>
          </div>
          
        </div>
        
        <div className="p-5 px-6 bg-white border-t border-border">
          <div className="flex gap-3 mb-2">
            <textarea 
              className="flex-1 py-3 px-4 border border-border rounded-lg font-sans text-[0.95rem] resize-none outline-none transition-colors bg-bg-page focus:border-navy-core" 
              placeholder="Type an encrypted message..."
              rows={1}
            ></textarea>
            <button className="w-12 h-12 flex items-center justify-center shrink-0 rounded-lg bg-navy-core text-white hover:bg-navy-deepest transition-colors">
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
            Your browser will encrypt this text before sending it to the server.
          </p>
        </div>
        
      </div>
    </div>
  );
}
