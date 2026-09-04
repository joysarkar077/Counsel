import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { NewCaseForm } from '@/components/dashboard/cases/new-case-form';

export default async function LawyerNewCasePage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');

  if (!userId) {
    redirect('/login');
  }

  return (
    <div className="animate-fade-up max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Open a New Case File
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Internal tracking or on behalf of a client. This data will be fully end-to-end encrypted before it leaves your browser.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 sm:p-8">
        <NewCaseForm />
      </div>
    </div>
  );
}
