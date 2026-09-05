'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { importAESKey, encryptText } from '@/lib/crypto/textCrypto';

interface SecureFieldEditorProps {
  title: string;
  caseId: string;
  aesKeyHex: string;
  field: string;
  initialData: any;
  renderDisplay: (data: any) => React.ReactNode;
  renderForm: (data: any, setData: (data: any) => void) => React.ReactNode;
  readOnly?: boolean;
}

export function SecureFieldEditor({
  title,
  caseId,
  aesKeyHex,
  field,
  initialData,
  renderDisplay,
  renderForm,
  readOnly = false
}: SecureFieldEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<any>(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!aesKeyHex) {
        throw new Error('Decryption key missing.');
      }
      const aesKey = await importAESKey(aesKeyHex);

      // 3. Stringify and encrypt data
      const jsonStr = JSON.stringify(data);
      const { ciphertextHex, ivHex } = await encryptText(jsonStr, aesKey);

      const payload = JSON.stringify({ ciphertextHex, ivHex });

      // 4. Send PATCH to API
      const res = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: payload })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save case details');
      }

      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'An error occurred during save.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {!isEditing ? (
          !readOnly && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-semibold text-navy-core hover:text-navy-deep transition-colors flex items-center gap-1"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Edit
            </button>
          )
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setData(initialData);
                setIsEditing(false);
              }}
              disabled={isSaving}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs font-semibold px-3 py-1.5 bg-navy-core text-white rounded-md hover:bg-navy-deep transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      <div className="text-sm text-slate-700">
        {!isEditing ? renderDisplay(data) : renderForm(data, setData)}
      </div>
    </div>
  );
}
