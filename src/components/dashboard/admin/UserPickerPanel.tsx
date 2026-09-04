'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';

export interface PickableUser {
  id: string;
  name: string;
  role: string;
  email: string;
  contact: string;
  avatarUrl: string | null;
  publicKey: string;
}

interface UserPickerPanelProps {
  label: string;
  required?: boolean;
  users: PickableUser[];
  selectedId: string;
  onSelect: (user: PickableUser | null) => void;
  emptyMessage?: string;
}

function MiniAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const [imgError, setImgError] = useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (avatarUrl && !imgError) {
    return <img src={avatarUrl} alt={name} width={36} height={36} className="rounded-full object-cover shrink-0 w-9 h-9" onError={() => setImgError(true)} />;
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy-core to-blue-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
      {initials || '?'}
    </div>
  );
}

export function UserPickerPanel({
  label,
  required = false,
  users,
  selectedId,
  onSelect,
  emptyMessage = 'No users available.',
}: UserPickerPanelProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.contact.toLowerCase().includes(q),
    );
  }, [users, query]);

  const selectedUser = users.find(u => u.id === selectedId);

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-900">
        {label}
        {required && <span className="text-rose-500 ml-0.5" aria-hidden>*</span>}
        {!required && <span className="text-slate-400 font-normal text-xs ml-1">(Optional)</span>}
      </label>

      {/* Selected user preview */}
      {selectedUser && (
        <div className="flex items-center gap-3 p-2.5 bg-navy-core/5 border border-navy-core/20 rounded-lg">
          <MiniAvatar name={selectedUser.name} avatarUrl={selectedUser.avatarUrl} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900 text-sm truncate">{selectedUser.name}</div>
            <div className="text-xs text-slate-500 truncate">{selectedUser.email}</div>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
            aria-label="Clear selection"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, email or mobile…"
          className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-core/20 focus:border-navy-core transition-all"
        />
      </div>

      {/* User list */}
      <div className="border border-slate-200 rounded-lg overflow-hidden max-h-52 overflow-y-auto divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-slate-400">{emptyMessage}</div>
        ) : (
          filtered.map(u => {
            const isSelected = u.id === selectedId;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => onSelect(isSelected ? null : u)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? 'bg-navy-core/5 border-l-2 border-l-navy-core'
                    : 'hover:bg-slate-50 border-l-2 border-l-transparent'
                }`}
              >
                <MiniAvatar name={u.name} avatarUrl={u.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 text-sm truncate">{u.name}</div>
                  <div className="text-xs text-slate-500 truncate">{u.email}</div>
                  {u.contact && (
                    <div className="text-[11px] text-slate-400 font-mono">{u.contact}</div>
                  )}
                </div>
                {isSelected && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-navy-core shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
