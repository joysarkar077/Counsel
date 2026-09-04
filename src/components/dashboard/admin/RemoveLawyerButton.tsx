'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RemoveLawyerButtonProps {
  caseId: string;
  lawyerId: string;
}

export function RemoveLawyerButton({ caseId, lawyerId }: RemoveLawyerButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove this attorney? Their access key will be securely revoked.')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/assign`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lawyerId }),
      });
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        alert(json.error || 'Failed to remove attorney');
      } else {
        router.refresh(); // Refresh the page to reflect the unassignment
      }
    } catch (err: any) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="ml-2 text-xs text-red-500 hover:text-red-700 font-semibold uppercase tracking-wider disabled:opacity-50"
      title="Remove Attorney"
    >
      {loading ? 'Removing...' : 'Remove'}
    </button>
  );
}
