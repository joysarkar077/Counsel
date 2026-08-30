import Link from 'next/link';
import ChatClient from './ChatClient';

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

      <ChatClient caseId={id} />
    </div>
  );
}
