import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Navigation Bar */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              C
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">Counsel</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-6 py-24 md:py-32 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left space-y-8">
              <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
                <span className="flex w-2 h-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
                Secure Legal Platform
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                Legal case management <br className="hidden md:block" />
                <span className="text-blue-600">built on cryptographic trust.</span>
              </h1>
              
              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Counsel is a zero-trust legal case management system where every record is encrypted, every action is signed, and every piece of sensitive data is cryptographically protected.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto text-base">
                    Create Free Account
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
                    View Features
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Visual / Brand Panel */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none">
              <div className="rounded-2xl border border-slate-200/60 bg-white shadow-xl shadow-slate-200/50 p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Zero-Trust Environment</h2>
                <p className="text-slate-500 mt-2 mb-8">"Your case. Your trust. Secured."</p>
                <div className="w-full space-y-3">
                  <div className="h-10 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center px-4 overflow-hidden">
                    <div className="w-16 h-2 rounded bg-slate-300"></div>
                  </div>
                  <div className="h-10 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center px-4 overflow-hidden relative">
                    <div className="w-24 h-2 rounded bg-emerald-300"></div>
                    <div className="absolute right-4 text-[10px] font-bold text-emerald-600">ENCRYPTED</div>
                  </div>
                  <div className="h-10 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center px-4 overflow-hidden">
                    <div className="w-32 h-2 rounded bg-slate-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-white border-y border-slate-200/60 py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                Everything encrypted. Everything audited.
              </h2>
              <p className="text-lg text-slate-600">
                Counsel was designed from the ground up for legal professionals who cannot afford a data breach.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((f) => (
                <div key={f.title} className="p-6 rounded-2xl border border-slate-200/60 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-slate-900 text-center px-6">
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Ready to secure your legal practice?
            </h2>
            <p className="text-lg text-slate-400">
              Join Counsel today. Registration is free and takes less than a minute.
            </p>
            <Link href="/register" className="inline-block mt-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white border-0">
                Create Your Account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white py-8 text-center text-slate-500 text-sm">
        <p>© 2026 Counsel. Secure Legal Case Management System.</p>
      </footer>
    </div>
  );
}
