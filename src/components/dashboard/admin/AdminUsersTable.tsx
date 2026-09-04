'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';

export interface AdminUserRow {
  id: string;
  name: string;
  role: string;
  email: string;
  contact: string;
  avatarUrl: string | null;
  isActive: boolean;
  position: string | null;
  department: string | null;
  createdAt: string | null;
}

interface AdminUsersTableProps {
  users: AdminUserRow[];
}

const ROLE_STYLES: Record<string, string> = {
  client: 'bg-blue-50 text-blue-700 border-blue-200/60',
  lawyer: 'bg-violet-50 text-violet-700 border-violet-200/60',
};

function UserAvatar({ name, avatarUrl, size = 36 }: { name: string; avatarUrl: string | null; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gradient-to-br from-navy-core to-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0"
    >
      {initials || '?'}
    </div>
  );
}

export function AdminUsersTable({ users }: AdminUsersTableProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'client' | 'lawyer'>('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.contact.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  return (
    <div className="bg-white rounded-xl shadow-subtle border border-slate-200/60 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200/60 bg-slate-50/50 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-800">
            All Users <span className="text-slate-400 font-normal">({filtered.length})</span>
          </h2>
          {/* Role tabs */}
          <div className="flex items-center gap-1 ml-3">
            {(['all', 'client', 'lawyer'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                  roleFilter === r
                    ? 'bg-navy-core text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, mobile…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-core/20 focus:border-navy-core transition-all"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200/60">
            <tr>
              <th className="px-6 py-3.5 w-1/3">User</th>
              <th className="px-6 py-3.5">Role</th>
              <th className="px-6 py-3.5">Email</th>
              <th className="px-6 py-3.5">Mobile</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size={36} />
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{u.name}</div>
                      {(u.position || u.department) && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {[u.position, u.department].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${ROLE_STYLES[u.role] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600 text-xs">{u.email || <span className="text-slate-300 italic">—</span>}</td>
                <td className="px-6 py-4 text-slate-600 text-xs font-mono">{u.contact || <span className="text-slate-300 italic">—</span>}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                    u.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                      : 'bg-slate-100 text-slate-500 border-slate-200/60'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-400">
                  {u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                  No users found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden divide-y divide-slate-100">
        {filtered.map(u => (
          <div key={u.id} className="p-4 flex items-start gap-3">
            <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900 text-sm truncate">{u.name}</span>
                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ROLE_STYLES[u.role] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 truncate">{u.email}</div>
              <div className="text-xs text-slate-400 font-mono">{u.contact}</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm">No users found.</div>
        )}
      </div>
    </div>
  );
}
