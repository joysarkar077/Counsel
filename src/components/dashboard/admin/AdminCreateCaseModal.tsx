'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { generateAESKey, exportAESKey, encryptText } from '@/lib/crypto/textCrypto';
import { encrypt } from '@/lib/crypto/rsa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPickerPanel, type PickableUser } from './UserPickerPanel';

interface AdminCreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'assign' | 'details';
type FormState = 'idle' | 'loading' | 'submitting' | 'error';

const CATEGORIES = [
  'Family Law',
  'Criminal Defense',
  'Corporate/Business',
  'Property/Real Estate',
  'Civil Litigation',
  'Immigration',
  'Other',
] as const;

const URGENCIES = [
  'Standard',
  'Urgent (Action < 30 days)',
  'Emergency (Immediate)',
] as const;

interface CaseFields {
  title: string;
  description: string;
  category: string;
  urgency: string;
  jurisdiction: string;
  opposingParty: string;
  claimValue: string;
}

export function AdminCreateCaseModal({ isOpen, onClose }: AdminCreateCaseModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('assign');
  const [formState, setFormState] = useState<FormState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const [clients, setClients] = useState<PickableUser[]>([]);
  const [lawyers, setLawyers] = useState<PickableUser[]>([]);
  const [adminKeys, setAdminKeys] = useState<{ userId: string; publicKey: string }[]>([]);

  const [selectedClient, setSelectedClient] = useState<PickableUser | null>(null);
  const [selectedLawyer, setSelectedLawyer] = useState<PickableUser | null>(null);

  const [fields, setFields] = useState<CaseFields>({
    title: '',
    description: '',
    category: '',
    urgency: 'Standard',
    jurisdiction: '',
    opposingParty: '',
    claimValue: '',
  });

  const [mounted, setMounted] = useState(false);

  // Reset on open
  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      setStep('assign');
      setSelectedClient(null);
      setSelectedLawyer(null);
      setFields({ title: '', description: '', category: '', urgency: 'Standard', jurisdiction: '', opposingParty: '', claimValue: '' });
      setErrorMessage('');
      setFormState('loading');

      Promise.all([
        fetch('/api/admin/users').then(r => r.json()),
        fetch('/api/admin/public-keys').then(r => r.json()),
      ]).then(([usersRes, keysRes]) => {
        if (usersRes.success) {
          setClients(usersRes.data.filter((u: PickableUser) => u.role === 'client'));
          setLawyers(usersRes.data.filter((u: PickableUser) => u.role === 'lawyer'));
        }
        if (keysRes.success) setAdminKeys(keysRes.data);
        setFormState('idle');
      }).catch(() => {
        setErrorMessage('Failed to load user data. Please try again.');
        setFormState('error');
      });
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const isDetailsValid =
    fields.title.trim() &&
    fields.description.trim() &&
    fields.category &&
    fields.urgency &&
    fields.jurisdiction.trim() &&
    fields.opposingParty.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLawyer) { setErrorMessage('Please select a lawyer.'); return; }
    if (!isDetailsValid) { setErrorMessage('Please fill in all required fields.'); return; }

    setFormState('submitting');
    setErrorMessage('');

    try {
      if (!selectedLawyer.publicKey) throw new Error('Selected lawyer has no public key. They may need to log in first.');

      // 1. Generate AES-256 case key
      const aesKey = await generateAESKey();
      const aesKeyHex = await exportAESKey(aesKey);

      // 2. Wrap AES key for all authorized parties
      const accessKeys: { userId: string; encryptedCaseKey: string }[] = [];
      const added = new Set<string>();

      const addKey = (userId: string, pubKeyStr: string) => {
        if (added.has(userId)) return;
        try {
          const pub = JSON.parse(pubKeyStr);
          accessKeys.push({ userId, encryptedCaseKey: encrypt(aesKeyHex, pub) });
          added.add(userId);
        } catch {
          // Skip malformed key
        }
      };

      // Admins
      for (const ak of adminKeys) addKey(ak.userId, ak.publicKey);
      // Lawyer
      addKey(selectedLawyer.id, selectedLawyer.publicKey);
      // Client (optional)
      if (selectedClient?.publicKey) addKey(selectedClient.id, selectedClient.publicKey);

      // 3. Encrypt all sensitive fields with AES
      const enc = async (val: string) => JSON.stringify(await encryptText(val, aesKey));
      const payload = {
        title_enc: await enc(fields.title),
        description_enc: await enc(fields.description),
        opposingParty_enc: await enc(fields.opposingParty),
        claimValue_enc: fields.claimValue ? await enc(fields.claimValue) : '',
        category_enc: await enc(fields.category),
        urgency_enc: await enc(fields.urgency),
        jurisdiction_enc: await enc(fields.jurisdiction),
        accessKeys,
        lawyerIds: [selectedLawyer.id],
        clientId: selectedClient ? selectedClient.id : null,
      };

      // 4. Submit
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Submission failed.');

      router.refresh();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMessage(message);
      setFormState('error');
    }
  };

  const field = (key: keyof CaseFields, value: string) =>
    setFields(prev => ({ ...prev, [key]: value }));

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col animate-fade-up overflow-hidden">

        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create New Case</h2>
            <p className="text-xs text-slate-500 mt-0.5">All sensitive data will be end-to-end encrypted before submission.</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Step pills */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium">
              <span className={`px-2.5 py-1 rounded-full transition-colors ${step === 'assign' ? 'bg-navy-core text-white' : 'bg-slate-100 text-slate-500'}`}>
                1. Assign Users
              </span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-slate-300"><path d="M9 18l6-6-6-6"/></svg>
              <span className={`px-2.5 py-1 rounded-full transition-colors ${step === 'details' ? 'bg-navy-core text-white' : 'bg-slate-100 text-slate-500'}`}>
                2. Case Details
              </span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {formState === 'loading' ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-navy-core/20 border-t-navy-core animate-spin" />
              <p className="text-sm text-slate-500">Loading user list…</p>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div role="alert" className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  {errorMessage}
                </div>
              )}

              {/* ─── Step 1: Assign Users ─── */}
              {step === 'assign' && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-1.5 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">Assign Users</h3>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        E2E Encrypted
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      Select the lawyer this case belongs to. Optionally assign a client now — you can also do this later.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <UserPickerPanel
                      label="Assign Lawyer"
                      required
                      users={lawyers}
                      selectedId={selectedLawyer?.id ?? ''}
                      onSelect={u => setSelectedLawyer(u)}
                      emptyMessage="No lawyers with initialized keys found."
                    />
                    <UserPickerPanel
                      label="Client"
                      users={clients}
                      selectedId={selectedClient?.id ?? ''}
                      onSelect={u => setSelectedClient(u)}
                      emptyMessage="No clients with initialized keys found."
                    />
                  </div>
                </div>
              )}

              {/* ─── Step 2: Case Details ─── */}
              {step === 'details' && (
                <form id="case-details-form" onSubmit={handleSubmit} className="space-y-6">
                  {/* Section header */}
                  <div className="flex flex-col gap-1.5 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">Case Details</h3>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        E2E Encrypted
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      All information is end-to-end encrypted before it leaves your browser. Only the assigned client and lawyer will be able to read it.
                    </p>
                  </div>

                  {/* Metadata row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="ac-category" className="text-sm font-semibold text-slate-900">
                        Practice Area <span className="text-rose-500" aria-hidden>*</span>
                      </label>
                      <select
                        id="ac-category"
                        required
                        value={fields.category}
                        onChange={e => field('category', e.target.value)}
                        disabled={formState === 'submitting'}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="" disabled>Select a category…</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="ac-urgency" className="text-sm font-semibold text-slate-900">
                        Urgency <span className="text-rose-500" aria-hidden>*</span>
                      </label>
                      <select
                        id="ac-urgency"
                        required
                        value={fields.urgency}
                        onChange={e => field('urgency', e.target.value)}
                        disabled={formState === 'submitting'}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="ac-jurisdiction" className="text-sm font-semibold text-slate-900">
                        Jurisdiction / District <span className="text-rose-500" aria-hidden>*</span>
                      </label>
                      <Input
                        id="ac-jurisdiction"
                        type="text"
                        required
                        placeholder="e.g. Dhaka District Court, Supreme Court"
                        value={fields.jurisdiction}
                        onChange={e => field('jurisdiction', e.target.value)}
                        disabled={formState === 'submitting'}
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <label htmlFor="ac-title" className="text-sm font-semibold text-slate-900 flex justify-between">
                      <span>Case Title <span className="text-rose-500" aria-hidden>*</span></span>
                      <span className="text-xs font-normal text-slate-400">{fields.title.length}/200</span>
                    </label>
                    <Input
                      id="ac-title"
                      type="text"
                      required
                      maxLength={200}
                      placeholder="e.g. Property Dispute — Smith vs. Johnson"
                      value={fields.title}
                      onChange={e => field('title', e.target.value)}
                      disabled={formState === 'submitting'}
                    />
                  </div>

                  {/* Opposing party + claim value */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="ac-opposing" className="text-sm font-semibold text-slate-900">
                        Opposing Party Name <span className="text-rose-500" aria-hidden>*</span>
                      </label>
                      <Input
                        id="ac-opposing"
                        type="text"
                        required
                        placeholder="Name of opposing person/company"
                        value={fields.opposingParty}
                        onChange={e => field('opposingParty', e.target.value)}
                        disabled={formState === 'submitting'}
                      />
                      <p className="text-[11px] text-slate-500">Required for conflict of interest checks.</p>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="ac-claim" className="text-sm font-semibold text-slate-900">
                        Estimated Claim Value <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <Input
                        id="ac-claim"
                        type="text"
                        placeholder="e.g. 50,000 BDT or N/A"
                        value={fields.claimValue}
                        onChange={e => field('claimValue', e.target.value)}
                        disabled={formState === 'submitting'}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label htmlFor="ac-description" className="text-sm font-semibold text-slate-900">
                      Description <span className="text-rose-500" aria-hidden>*</span>
                    </label>
                    <textarea
                      id="ac-description"
                      required
                      rows={6}
                      placeholder="Describe the nature of the legal matter in as much detail as possible…"
                      value={fields.description}
                      onChange={e => field('description', e.target.value)}
                      disabled={formState === 'submitting'}
                      className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[120px] resize-y"
                    />
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={step === 'assign' ? onClose : () => setStep('assign')}
            disabled={formState === 'submitting'}
          >
            {step === 'assign' ? 'Cancel' : '← Back'}
          </Button>

          <div className="flex items-center gap-3">
            {step === 'assign' && (
              <Button
                type="button"
                disabled={!selectedLawyer || formState === 'loading'}
                onClick={() => { setErrorMessage(''); setStep('details'); }}
              >
                Next: Case Details →
              </Button>
            )}

            {step === 'details' && (
              <Button
                type="submit"
                form="case-details-form"
                disabled={!isDetailsValid || formState === 'submitting'}
              >
                {formState === 'submitting' ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Encrypting & Saving…
                  </span>
                ) : (
                  'Create Case'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
