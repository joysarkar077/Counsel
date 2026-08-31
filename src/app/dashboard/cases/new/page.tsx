import Link from 'next/link';
import { NewCaseForm } from '@/components/dashboard/cases/new-case-form';
import { Card, CardContent } from '@/components/ui/card';

export default function NewCasePage() {
  return (
    <div className="animate-fade-up space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/cases"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Cases
        </Link>
        
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
          New Case Request
        </h1>
        <p className="text-sm text-slate-500">
          Provide details about your legal matter. An admin will review and assign a lawyer to your case.
        </p>
      </div>

      {/* Form Card */}
      <Card>
        <CardContent className="pt-6">
          <NewCaseForm />
        </CardContent>
      </Card>
    </div>
  );
}
