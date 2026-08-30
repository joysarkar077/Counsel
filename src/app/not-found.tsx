import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-68px)] flex justify-center items-center p-6 bg-bg-page">
      <div className="bg-bg-card border border-border shadow-sm rounded-xl animate-fade-up max-w-[420px] w-full py-14 px-10 text-center flex flex-col items-center gap-3">
        <p className="text-[5rem] font-extrabold text-navy-core tracking-tighter leading-none mb-2">404</p>
        <h1 className="text-[1.4rem] font-bold text-text-primary">Page not found</h1>
        <p className="text-[0.92rem] text-text-muted leading-relaxed mb-3">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/" className="bg-navy-core text-white font-semibold py-2.5 px-7 rounded-lg hover:bg-navy-deepest transition-colors inline-block">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
