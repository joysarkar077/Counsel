import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { decrypt } from '@/lib/crypto/rsa';
import { AdminUsersTable } from '@/components/dashboard/admin/AdminUsersTable';
import type { AdminUserRow } from '@/components/dashboard/admin/AdminUsersTable';

export const metadata = {
  title: 'User Management — Counsel Admin',
  description: 'View and manage all clients and lawyers on the Counsel platform.',
};

export default async function AdminUsersPage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');

  if (!userId) redirect('/login');

  await dbConnect();

  const adminUser = await User.findById(userId).lean();
  if (adminUser?.role !== 'admin' && adminUser?.role !== 'super_admin') {
    return <div className="p-10 text-red-500">Access Denied.</div>;
  }

  const rawUsers = await User.find({ role: { $in: ['client', 'lawyer'] } })
    .sort({ createdAt: -1 })
    .lean();

  const users: AdminUserRow[] = rawUsers.map(u => {
    let userPrivateKey: { d: string; n: string } | null = null;
    if (u.publicKey && u.encryptedPrivateKey) {
      try {
        const pub = JSON.parse(u.publicKey);
        userPrivateKey = { d: u.encryptedPrivateKey, n: pub.n };
      } catch {
        // ignore
      }
    }

    const tryDecryptField = (encHex: string | undefined, fallback: string): string => {
      if (!encHex || !userPrivateKey) return fallback;
      try {
        return decrypt(encHex, userPrivateKey);
      } catch {
        return fallback;
      }
    };

    return {
      id: u._id.toString(),
      name: u.fullName || `User ${u._id.toString().slice(-4)}`,
      role: u.role,
      publicKey: u.publicKey,
      email: tryDecryptField(u.email_enc, ''),
      contact: tryDecryptField(u.contact_enc, ''),
      avatarUrl: u.avatarUrl ?? null,
      isActive: u.isActive,
      position: u.position ?? null,
      department: u.department ?? null,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
    };
  });

  const clientCount = users.filter(u => u.role === 'client').length;
  const lawyerCount = users.filter(u => u.role === 'lawyer').length;

  return (
    <div className="animate-fade-up space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div>
          <h1 className="text-[1.8rem] font-extrabold tracking-tight text-navy-deepest mb-1">
            User Management
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            All registered clients and lawyers on the platform.
          </p>
        </div>
        {/* Summary pills */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200/60 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {clientCount} Clients
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full border border-violet-200/60 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            {lawyerCount} Lawyers
          </div>
        </div>
      </div>

      <AdminUsersTable users={users} />
    </div>
  );
}
