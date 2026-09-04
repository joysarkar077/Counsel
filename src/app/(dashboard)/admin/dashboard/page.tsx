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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link 
          href="/admin/dashboard/cases"
          className="group bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 hover:shadow-md hover:border-navy-core/40 transition-all block"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-navy-core transition-colors">Platform Cases</h2>
          <p className="text-sm text-slate-500 font-medium">Review and assign all E2EE case files submitted across the platform.</p>
        </Link>
        
        <Link 
          href="/admin/dashboard/users"
          className="group bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 hover:shadow-md hover:border-navy-core/40 transition-all block"
        >
          <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20H7m10-4H7m10-4H7M5 8a2 2 0 110-4 2 2 0 010 4zm12 0a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-navy-core transition-colors">User Management</h2>
          <p className="text-sm text-slate-500 font-medium">View, search and manage all registered clients and lawyers.</p>
        </Link>
      </div>
    </div>
  );
}
