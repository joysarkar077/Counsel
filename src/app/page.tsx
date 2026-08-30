import Link from 'next/link';

const features = [
  {
    icon: '🔐',
    title: 'RSA-Encrypted PII',
    desc: 'Your name, email, and contact details are encrypted with RSA before being stored. Nobody — not even the database admin — can read your personal data.',
  },
  {
    icon: '⚖️',
    title: 'Full Case Lifecycle',
    desc: 'From submission to closure, every case follows a strict, audited state machine: Pending → Active → Close Requested → Closed.',
  },
  {
    icon: '🔑',
    title: 'Two-Factor Auth (TOTP)',
    desc: 'Login requires your password and a 30-second rotating code. A stolen password alone is not enough to break in.',
  },
  {
    icon: '🛡️',
    title: 'Tamper-Evident Records',
    desc: 'Every record (case notes, messages, hearings) has an HMAC fingerprint. Any tampering is instantly detectable.',
  },
  {
    icon: '💬',
    title: 'Private Lawyer–Client Messaging',
    desc: 'End-to-end encrypted messages between each client and their assigned lawyer, invisible to other parties on the same case.',
  },
  {
    icon: '📋',
    title: 'Role-Based Access Control',
    desc: 'Clients, Lawyers, and Admins each operate within a strictly enforced permission matrix. No role can exceed its boundaries.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="grid md:grid-cols-2 min-h-[calc(100vh-68px)] max-w-7xl mx-auto py-20 px-8 gap-16 items-center">
        <div className="flex flex-col gap-6">
          <span className="inline-block bg-gold/10 text-gold border border-gold/30 rounded-full py-1.5 px-4 text-[0.82rem] font-semibold tracking-wider uppercase w-fit">
            Bangladesh's Secure Legal Platform
          </span>
          <h1 className="text-[3.2rem] font-extrabold leading-[1.15] text-text-primary tracking-tight">
            Legal case management
            <br />
            <span className="text-gold">built on cryptographic trust.</span>
          </h1>
          <p className="text-[1.05rem] text-text-secondary leading-relaxed max-w-[520px]">
            Counsel is a zero-trust legal case management system where every record is encrypted, every action is signed, and every piece of sensitive data is cryptographically protected.
          </p>
          <div className="flex gap-3.5 flex-wrap">
            <Link href="/register" className="bg-navy-core text-white font-semibold py-3 px-8 rounded-lg hover:bg-navy-deepest transition-colors">
              Get Started — It's Free
            </Link>
            <Link href="/login" className="border border-border text-navy-core font-semibold py-3 px-8 rounded-lg hover:bg-navy-core hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
        <div className="flex justify-end items-center">
          <div className="bg-navy-deepest rounded-2xl py-16 px-12 flex flex-col items-center gap-5 w-full max-w-[380px]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[72px] h-[72px] text-gold">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <p className="text-[2rem] font-extrabold text-white tracking-tight">Counsel</p>
            <p className="text-[0.9rem] text-white/55 italic text-center">"Your case. Your trust. Secured."</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-bg-page py-24 px-8 border-t border-border" id="features">
        <div className="text-center max-w-[640px] mx-auto mb-14 flex flex-col items-center gap-4">
          <span className="inline-block bg-navy-core/10 text-navy-core border border-navy-core/20 rounded-full py-1.5 px-4 text-[0.82rem] font-semibold tracking-wider uppercase w-fit">
            Features
          </span>
          <h2 className="text-[2rem] font-extrabold text-text-primary tracking-tight leading-snug">
            Everything encrypted. Everything audited.
          </h2>
          <p className="text-base text-text-secondary leading-relaxed">
            Counsel was designed from the ground up for legal professionals who cannot afford a data breach.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="bg-bg-card rounded-xl shadow-sm border border-border p-6 flex flex-col gap-3 transition-all hover:-translate-y-1 hover:shadow-md">
              <span className="text-[2rem]">{f.icon}</span>
              <h3 className="text-base font-bold text-text-primary">{f.title}</h3>
              <p className="text-[0.9rem] text-text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security Section */}
      <section className="bg-white border-y border-border py-24 px-8" id="security">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <div className="flex flex-col gap-5">
            <span className="inline-block bg-navy-core/10 text-navy-core border border-navy-core/20 rounded-full py-1.5 px-4 text-[0.82rem] font-semibold tracking-wider uppercase w-fit">
              Zero-Trust Architecture
            </span>
            <h2 className="text-[2rem] font-extrabold text-text-primary tracking-tight leading-snug">
              Even a full database breach leaks nothing.
            </h2>
            <p className="text-base text-text-secondary leading-relaxed">
              All personal identifiable information — names, emails, phone numbers — is encrypted with RSA before it is written to the database. All case content uses ECC-based ECIES encryption. Passwords are never stored; only a custom-iterated hash is kept.
            </p>
            <ul className="flex flex-col gap-2.5 text-[0.92rem] text-text-secondary font-medium">
              <li className="flex gap-2 items-start">✓ RSA-encrypted PII (names, email, contact)</li>
              <li className="flex gap-2 items-start">✓ ECC/ECIES-encrypted case content, notes, messages</li>
              <li className="flex gap-2 items-start">✓ HMAC integrity fingerprints on every record</li>
              <li className="flex gap-2 items-start">✓ TOTP two-factor authentication</li>
              <li className="flex gap-2 items-start">✓ Hash-chained, tamper-evident audit log</li>
            </ul>
          </div>
          <div className="flex justify-center">
            <div className="bg-navy-deepest rounded-2xl p-8 w-full max-w-[360px] flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-[0.82rem] font-semibold text-white/45 uppercase tracking-wider">Name</span>
                <span className="font-mono text-[0.85rem] text-gold">3a9f1b2c…</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-[0.82rem] font-semibold text-white/45 uppercase tracking-wider">Email</span>
                <span className="font-mono text-[0.85rem] text-gold">8f2d0e5a…</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-[0.82rem] font-semibold text-white/45 uppercase tracking-wider">Case</span>
                <span className="font-mono text-[0.85rem] text-gold">c4b7f91e…</span>
              </div>
              <div className="flex justify-between items-center pb-3">
                <span className="text-[0.82rem] font-semibold text-white/45 uppercase tracking-wider">Message</span>
                <span className="font-mono text-[0.85rem] text-gold">7a3f1902…</span>
              </div>
              <div className="text-[0.78rem] text-white/35 text-center mt-1">All fields encrypted at rest</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-bg-page py-24 px-8">
        <div className="max-w-[600px] mx-auto text-center flex flex-col items-center gap-4">
          <h2 className="text-[2rem] font-extrabold text-text-primary tracking-tight">Ready to secure your legal practice?</h2>
          <p className="text-base text-text-secondary mb-2">Join Counsel today. Registration is free.</p>
          <Link href="/register" className="bg-gold hover:bg-gold-hover text-white font-semibold py-3.5 px-10 rounded-lg transition-colors">
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-8 text-center text-[0.82rem] text-text-muted">
        <p>© 2026 Counsel. Secure Legal Case Management System</p>
      </footer>
    </div>
  );
}
