import Link from 'next/link';

export default async function CaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div className="animate-fade-up">
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <Link href="/dashboard/cases" className="text-[0.9rem] font-semibold text-text-muted hover:text-navy-core transition-colors">&larr; Back to Cases</Link>
          <span className="bg-emerald-500/15 text-emerald-600 text-[0.75rem] font-bold py-1 px-3 rounded-full tracking-wider">ACTIVE</span>
        </div>
        
        <h1 className="text-[2.2rem] font-extrabold text-navy-deepest tracking-tight mb-3">Intellectual Property Dispute</h1>
        <div className="flex items-center gap-3 text-[0.9rem] text-text-muted">
          <span className="font-mono font-semibold text-navy-core bg-navy-core/5 py-1 px-2 rounded-md">{id.toUpperCase()}</span>
          <span className="text-border">•</span>
          <span>Submitted on Aug 28, 2026</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1.5 text-gold-muted font-semibold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            ECC Encrypted
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2.5fr_1fr] gap-8">
        <div className="flex flex-col gap-8">
          
          <div className="bg-bg-card border border-border shadow-sm rounded-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[1.3rem] font-bold text-navy-deepest">Case Description</h2>
              <span className="text-[0.75rem] font-semibold text-navy-core bg-navy-core/5 py-1 px-2.5 rounded-full uppercase">Decrypted Locally</span>
            </div>
            <div className="text-base text-text-secondary leading-relaxed flex flex-col gap-4 mb-8">
              <p>
                Client alleges that the opposing party (TechCorp Inc.) has willfully infringed upon patent US-2026-XYZ regarding the novel cryptographic key exchange protocol. 
              </p>
              <p>
                The breach was discovered on August 15th when TechCorp released their new enterprise messaging software which clearly utilizes the patented handshaking mechanism without a license. Client seeks an immediate injunction and damages.
              </p>
            </div>
            
            <div className="flex items-center justify-between bg-bg-page py-5 px-6 rounded-xl border border-border">
              <div className="flex flex-col gap-1">
                <span className="text-[0.8rem] font-semibold uppercase tracking-wider text-text-muted">Client</span>
                <span className="text-[1.1rem] font-bold text-navy-deepest">Jotee Sarkar Joy</span>
              </div>
              <div className="text-base font-bold text-border italic">vs</div>
              <div className="flex flex-col gap-1 text-right">
                <span className="text-[0.8rem] font-semibold uppercase tracking-wider text-text-muted">Opposing Party</span>
                <span className="text-[1.1rem] font-bold text-navy-deepest">TechCorp Inc.</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <h2 className="text-[1.3rem] font-bold text-navy-deepest mb-6">Case Timeline</h2>
            
            <div className="flex flex-col relative before:content-[''] before:absolute before:left-[5px] before:top-2 before:bottom-0 before:w-[2px] before:bg-border">
              <div className="flex gap-6 mb-8 relative last:mb-0">
                <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-navy-core relative z-10 mt-1 shrink-0"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-[0.85rem] text-text-muted">Aug 28, 2026</span>
                  <span className="text-[1.05rem] font-bold text-text-primary">Lawyer Assigned</span>
                  <p className="text-[0.95rem] text-text-secondary leading-relaxed mt-1">Adv. Anisul Huq was assigned to this case by the Admin.</p>
                </div>
              </div>
              
              <div className="flex gap-6 mb-8 relative last:mb-0">
                <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-navy-core relative z-10 mt-1 shrink-0"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-[0.85rem] text-text-muted">Aug 27, 2026</span>
                  <span className="text-[1.05rem] font-bold text-text-primary">Case Accepted</span>
                  <p className="text-[0.95rem] text-text-secondary leading-relaxed mt-1">Status changed from PENDING_REVIEW to ACTIVE. RSA Signature Verified.</p>
                </div>
              </div>
              
              <div className="flex gap-6 mb-8 relative last:mb-0">
                <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-navy-core relative z-10 mt-1 shrink-0"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-[0.85rem] text-text-muted">Aug 27, 2026</span>
                  <span className="text-[1.05rem] font-bold text-text-primary">Case Submitted</span>
                  <p className="text-[0.95rem] text-text-secondary leading-relaxed mt-1">Client successfully submitted the encrypted case request.</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
        
        <div className="flex flex-col gap-6">
          
          <div className="p-6 bg-navy-deepest rounded-xl border border-navy-deepest">
            <h2 className="text-white text-[1.2rem] mb-2 font-bold">Communication</h2>
            <p className="text-white/70 text-[0.9rem] leading-relaxed mb-6">All messages are end-to-end encrypted and signed for non-repudiation.</p>
            <Link href={`/dashboard/cases/${id}/chat`} className="w-full flex items-center justify-center gap-2 bg-gold text-white font-semibold py-2.5 rounded-lg hover:bg-gold-hover transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Open Secure Chat
            </Link>
          </div>
          
          <div className="bg-bg-card border border-border shadow-sm rounded-xl p-6">
            <h2 className="text-[1.1rem] font-bold text-navy-deepest mb-5">Assigned Team</h2>
            
            <div className="flex items-center gap-4 mb-4 last:mb-0">
              <div className="w-10 h-10 rounded-full bg-navy-core/10 text-navy-core flex items-center justify-center font-bold text-[0.9rem]">AH</div>
              <div className="flex flex-col">
                <span className="text-[0.95rem] font-bold text-text-primary">Adv. Anisul Huq</span>
                <span className="text-[0.8rem] text-text-muted">Lead Lawyer</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-4 last:mb-0">
              <div className="w-10 h-10 rounded-full bg-navy-core/10 text-navy-core flex items-center justify-center font-bold text-[0.9rem]">JS</div>
              <div className="flex flex-col">
                <span className="text-[0.95rem] font-bold text-text-primary">Jotee Sarkar Joy</span>
                <span className="text-[0.8rem] text-text-muted">Client</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
