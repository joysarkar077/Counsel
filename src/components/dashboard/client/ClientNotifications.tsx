'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

export interface ClientNotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'case_update' | 'assignment' | 'message' | 'system' | string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface ClientNotificationsProps {
  readonly initialNotifications: readonly ClientNotificationItem[];
}

export function ClientNotifications({ initialNotifications }: ClientNotificationsProps): React.ReactNode {
  const [notifications, setNotifications] = useState<readonly ClientNotificationItem[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'MARK_READ' }),
      });
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleDismiss = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'DISMISS' }),
      });
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'ALL', action: 'MARK_READ' }),
      });
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'UNREAD') return !n.read;
      if (activeTab === 'CASE_UPDATE') return n.category === 'case_update';
      if (activeTab === 'SYSTEM') return n.category === 'system';
      return true;
    });
  }, [notifications, activeTab]);

  const getCategoryIcon = (category: string): React.ReactNode => {
    switch (category) {
      case 'case_update':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
        );
      case 'message':
        return (
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        );
      case 'system':
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Notifications</h2>
          {unreadCount > 0 && (
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors self-start sm:self-auto"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5 text-xs font-medium text-slate-500 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1 rounded-md transition-colors ${
            activeTab === 'ALL' ? 'bg-slate-900 text-white font-semibold' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('UNREAD')}
          className={`px-3 py-1 rounded-md transition-colors ${
            activeTab === 'UNREAD' ? 'bg-slate-900 text-white font-semibold' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setActiveTab('CASE_UPDATE')}
          className={`px-3 py-1 rounded-md transition-colors ${
            activeTab === 'CASE_UPDATE' ? 'bg-slate-900 text-white font-semibold' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          Case Updates
        </button>
      </div>

      {/* Notification Items */}
      {filteredNotifications.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 rounded-lg border border-dashed border-slate-200">
          No notifications available.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 group ${
                item.read
                  ? 'border-slate-100 bg-slate-50/40 text-slate-600'
                  : 'border-slate-200 bg-white text-slate-900 font-medium shadow-sm'
              }`}
            >
              {getCategoryIcon(item.category)}

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{item.title}</h4>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>

                {item.actionUrl && (
                  <div className="pt-1">
                    <Link
                      href={item.actionUrl}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
                    >
                      View details →
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                {!item.read && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    title="Mark as read"
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => handleDismiss(item.id)}
                  title="Dismiss"
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
