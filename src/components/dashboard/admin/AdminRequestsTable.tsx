'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RequestItem {
  _id: string;
  fullName: string;
  email: string;
  contact: string;
  createdAt: string;
}

export function AdminRequestsTable() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/requests');
      if (!res.ok) throw new Error('Failed to fetch requests');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/admin/requests/${id}/activate`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to approve');
      
      setSuccessMsg('Lawyer approved successfully.');
      setRequests((prev) => prev.filter(req => req._id !== id));
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading requests...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-rose-50 text-rose-600 text-sm font-medium border border-rose-200">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-medium border border-emerald-200">
          {successMsg}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center shadow-subtle">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <polyline points="17 11 19 13 23 9" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-800">No Pending Requests</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            All lawyer accounts have been processed. New registrations will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-subtle border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/60">
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Lawyer Name
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Contact No.
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Registered At
                  </th>
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-core to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {req.fullName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-navy-core transition-colors">
                            {req.fullName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-sm text-slate-600">
                        {req.email}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-sm text-slate-600">
                        {req.contact}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-sm text-slate-600">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleApprove(req._id)}
                        disabled={processingId === req._id}
                        className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium text-xs px-3 py-1.5 rounded-lg transition-colors border border-emerald-200/60 disabled:opacity-50"
                      >
                        {processingId === req._id ? (
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
