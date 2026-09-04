'use client';

import { useState } from 'react';
import type { CaseStatus } from '@/types/case';

interface AdminCaseStatusUpdaterProps {
  caseId: string;
  currentStatus: CaseStatus | string;
}

const STATUS_OPTIONS: { value: CaseStatus; label: string }[] = [
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CLOSE_REQUESTED', label: 'Close Requested' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'REJECTED', label: 'Rejected' },
];

export function AdminCaseStatusUpdater({ caseId, currentStatus }: AdminCaseStatusUpdaterProps) {
  const [status, setStatus] = useState<string>(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdate = async () => {
    if (status === currentStatus) return;
    setIsUpdating(true);
    setMessage('');

    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update status');
      }

      setMessage('Status updated successfully');
      setTimeout(() => window.location.reload(), 1000); // Reload to reflect changes
    } catch (err: any) {
      setMessage(err.message || 'An error occurred');
      setStatus(currentStatus); // Revert
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        disabled={isUpdating}
        className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-core bg-white text-slate-900 min-w-[160px]"
      >
        {STATUS_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <button
        onClick={handleUpdate}
        disabled={isUpdating || status === currentStatus}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-md transition-colors"
      >
        {isUpdating ? 'Updating...' : 'Update'}
      </button>
      {message && <span className={`text-xs ${message.includes('error') ? 'text-red-500' : 'text-green-600'}`}>{message}</span>}
    </div>
  );
}
