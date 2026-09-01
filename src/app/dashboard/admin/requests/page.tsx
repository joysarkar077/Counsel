'use client';

import { useState, useEffect } from 'react';

type LawyerRequest = {
  _id: string;
  username_enc: string;
  emailHash: string;
  createdAt: string;
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<LawyerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/requests');
      if (!res.ok) {
        throw new Error('Failed to fetch requests');
      }
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleActivate = async (id: string) => {
    if (!confirm('Are you sure you want to activate this lawyer account?')) return;
    
    try {
      const res = await fetch(`/api/admin/requests/${id}/activate`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to activate account');
      }
      
      // Remove from list
      setRequests((prev) => prev.filter((req) => req._id !== id));
      alert('Lawyer activated successfully.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="animate-fade-up max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lawyer Registration Requests</h1>
        <p className="text-sm text-slate-500 mt-1">Review and activate pending lawyer accounts.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-subtle overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading requests...</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 text-sm">{error}</div>
        ) : requests.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-slate-400">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No pending requests</h3>
            <p className="text-xs text-slate-500 mt-1">All lawyer registration requests have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/60">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Username (Encrypted)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Hash</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Requested</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((request) => (
                  <tr key={request._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900 truncate max-w-[150px]" title={request.username_enc}>
                        {request.username_enc.substring(0, 20)}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 truncate max-w-[200px]" title={request.emailHash}>
                        {request.emailHash.substring(0, 20)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleActivate(request._id)}
                        className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Activate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
