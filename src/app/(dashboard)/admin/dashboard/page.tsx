import Link from 'next/link';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';

export default async function AdminDashboardPage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');

  if (userId) {
    await dbConnect();
    const user = await User.findById(userId).select('role').lean();
    // In a real app, you might want to redirect non-admins or handle authorization
  }

  return (
    <div className="animate-fade-up space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage platform users, cases, and settings.</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-subtle p-6">
         <p className="text-slate-500 text-sm">Admin overview coming soon.</p>
      </div>
    </div>
  );
}
