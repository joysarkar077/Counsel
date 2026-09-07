'use client';

import { useState, useTransition } from 'react';
import { signStateTransition } from '@/lib/crypto/stateVerification';
import type { RSAPrivateKey } from '@/lib/crypto/rsa';
import type { CaseStatus } from '@/types/case';

/** All statuses a lawyer can transition to from a given current status. */
const NEXT_STATES: Partial<Record<CaseStatus, { value: CaseStatus; label: string }[]>> = {
  PENDING_REVIEW: [
    { value: 'ACTIVE', label: 'Activate (Accept Case)' },
    { value: 'REJECTED', label: 'Reject Case' },
  ],
  ACTIVE: [
    { value: 'CLOSE_REQUESTED', label: 'Request Closure' },
  ],
  CLOSE_REQUESTED: [
    { value: 'CLOSED', label: 'Confirm Closure' },
    { value: 'ACTIVE', label: 'Reopen (Return to Active)' },
  ],
};

const STATUS_LABELS: Record<CaseStatus, string> = {
  PENDING_REVIEW: 'Pending Review',
  ACTIVE: 'Active',
  CLOSE_REQUESTED: 'Close Requested',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
};

const STATUS_STYLES: Record<CaseStatus, string> = {
  PENDING_REVIEW: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  CLOSE_REQUESTED: 'bg-rose-100 text-rose-800',
  CLOSED: 'bg-slate-100 text-slate-800',
  REJECTED: 'bg-slate-100 text-slate-800',
};

export interface StatusChangeModalProps {
  caseId: string;
  caseMongoId: string;
  currentStatus: CaseStatus;
  /** The lawyer's RSA private key `d` scalar hex from the database. */
  rsaPrivateKeyHex: string;
  /** The lawyer's RSA public key JSON string (needed to parse `n`). */
  rsaPublicKeyJson: string;
  onSuccess: (newStatus: CaseStatus) => void;
}

export function StatusChangeModal({
  caseId,
  caseMongoId,
  currentStatus,
  rsaPrivateKeyHex,
  rsaPublicKeyJson,
  onSuccess,
}: StatusChangeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus | ''>('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const options = NEXT_STATES[currentStatus] ?? [];

  // Terminal states — no button shown
  if (options.length === 0) return null;

  function openModal() {
    setSelectedStatus('');
    setError('');
    setIsOpen(true);
  }

  function closeModal() {
    if (!isPending) setIsOpen(false);
  }

  async function handleConfirm() {
    if (!selectedStatus) {
      setError('Please select a new status.');
      return;
    }

    setError('');

    startTransition(async () => {
      try {
        // Parse the RSA public key JSON to extract `n` (needed to reconstruct the full key)
        const rsaPublicKey = JSON.parse(rsaPublicKeyJson);
        const rsaPrivateKey: RSAPrivateKey = {
          d: rsaPrivateKeyHex,
          n: rsaPublicKey.n,
        };

        // Sign the state transition in the browser using our from-scratch RSA implementation.
        // This proves non-repudiation — only this lawyer (with this private key) could sign it.
        const { signatureHex, timestamp } = await signStateTransition(
          caseId,
          currentStatus,
          selectedStatus,
          rsaPrivateKey,
        );

        const res = await fetch(`/api/cases/${caseMongoId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newStatus: selectedStatus, signatureHex, timestamp }),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error ?? 'Failed to update status. Please try again.');
          return;
        }

        onSuccess(selectedStatus as CaseStatus);
        setIsOpen(false);
      } catch (err: any) {
        console.error('StatusChangeModal error:', err);
        setError(err.message ?? 'An unexpected error occurred.');
      }
    });
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={openModal}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5" aria-hidden>
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Change Status
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Change Case Status</h2>
                <p className="text-xs text-slate-500 mt-1">
                  This action will be cryptographically signed with your RSA private key.
                </p>
              </div>
              <button
                onClick={closeModal}
                disabled={isPending}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg"
                aria-label="Close modal"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Current Status */}
            <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Current Status</p>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_STYLES[currentStatus]}`}>
                {STATUS_LABELS[currentStatus]}
              </span>
            </div>

            {/* New Status Select */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                New Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as CaseStatus);
                  setError('');
                }}
                disabled={isPending}
                className="w-full text-sm px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all bg-white disabled:opacity-60"
              >
                <option value="">— Select new status —</option>
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* RSA Notice */}
            <div className="mb-5 flex items-start gap-2.5 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" aria-hidden>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <p className="text-xs text-blue-700 leading-relaxed">
                Confirming this action will generate an <strong>RSA digital signature</strong> using your private key. This creates an irrefutable audit trail — you cannot deny authorising this change.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending || !selectedStatus}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing & Submitting…
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5" aria-hidden>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Confirm & Sign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

