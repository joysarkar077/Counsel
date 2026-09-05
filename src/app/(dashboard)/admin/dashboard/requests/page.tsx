import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminRequestsTable } from '@/components/dashboard/admin/AdminRequestsTable';

export default async function AdminRequestsPage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const userRole = headersList.get('x-user-role');

  if (!userId || (userRole !== 'admin' && userRole !== 'super_admin')) {
    redirect('/login');
  }

  return (
    <div className="animate-fade-up max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[1.8rem] font-extrabold text-navy-deepest tracking-tight mb-1">
          Lawyer Approvals
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Review and activate pending lawyer registrations. Lawyers cannot access the system until approved by an administrator.
        </p>
      </div>

      <AdminRequestsTable />
    </div>
  );
}
