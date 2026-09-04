'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CaseFormData } from './new-case-form/types';
import { FormHeader } from './new-case-form/form-header';
import { MetadataFields } from './new-case-form/metadata-fields';
import { DetailFields } from './new-case-form/detail-fields';
import { FormActions } from './new-case-form/form-actions';
import { generateAESKey, exportAESKey, encryptText } from '@/lib/crypto/textCrypto';
import { encrypt } from '@/lib/crypto/rsa';

export interface NewCaseFormProps {
  /** Called after a successful submission with the new case id. */
  onSuccess?: (id: string) => void;
}

type FormState = 'idle' | 'submitting' | 'error';

export function NewCaseForm({ onSuccess }: NewCaseFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState<CaseFormData>({
    category: '',
    urgency: 'Standard',
    jurisdiction: '',
    title: '',
    opposingParty: '',
    claimValue: '',
    description: '',
  });

  const isSubmitting = formState === 'submitting';

  const isFormValid =
    formData.title.trim() &&
    formData.description.trim() &&
    formData.category &&
    formData.urgency &&
    formData.jurisdiction.trim() &&
    formData.opposingParty.trim();

  const handleFieldChange = (field: keyof CaseFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState('submitting');
    setErrorMessage('');

    try {
      // 1. Fetch Admin keys and Creator key
      const [adminKeysRes, myKeyRes] = await Promise.all([
        fetch('/api/admin/public-keys'),
        fetch('/api/user/me/public-key')
      ]);

      const adminKeysJson = await adminKeysRes.json();
      const myKeyJson = await myKeyRes.json();

      if (!adminKeysRes.ok || !myKeyRes.ok) {
        throw new Error('Failed to fetch encryption keys from the server.');
      }

      // 2. Generate AES-256 Case Key
      const aesKey = await generateAESKey();
      const aesKeyHex = await exportAESKey(aesKey);

      // 3. Wrap AES key with all authorized RSA public keys
      const accessKeys: { userId: string, encryptedCaseKey: string }[] = [];
      const addedUsers = new Set<string>();

      // Wrap for creator
      const myPubKey = JSON.parse(myKeyJson.data.publicKey);
      accessKeys.push({
        userId: myKeyJson.data.userId,
        encryptedCaseKey: encrypt(aesKeyHex, myPubKey)
      });
      addedUsers.add(myKeyJson.data.userId);

      // Wrap for admins
      for (const admin of adminKeysJson.data) {
        if (!addedUsers.has(admin.userId)) {
          const adminPubKey = JSON.parse(admin.publicKey);
          accessKeys.push({
            userId: admin.userId,
            encryptedCaseKey: encrypt(aesKeyHex, adminPubKey)
          });
          addedUsers.add(admin.userId);
        }
      }

      // 4. Encrypt form fields with AES
      const titleRes = await encryptText(formData.title, aesKey);
      const descRes = await encryptText(formData.description, aesKey);
      const oppRes = await encryptText(formData.opposingParty, aesKey);
      const claimRes = formData.claimValue ? await encryptText(formData.claimValue, aesKey) : null;
      const catRes = await encryptText(formData.category, aesKey);
      const urgRes = await encryptText(formData.urgency, aesKey);
      const jurRes = await encryptText(formData.jurisdiction, aesKey);

      // We store both the ciphertext and IV as a JSON string so it can be parsed back
      const payload = {
        title_enc: JSON.stringify(titleRes),
        description_enc: JSON.stringify(descRes),
        opposingParty_enc: JSON.stringify(oppRes),
        claimValue_enc: claimRes ? JSON.stringify(claimRes) : '',
        category_enc: JSON.stringify(catRes),
        urgency_enc: JSON.stringify(urgRes),
        jurisdiction_enc: JSON.stringify(jurRes),
        accessKeys
      };

      // 5. Submit to backend
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.error ?? 'Something went wrong. Please try again.');
        setFormState('error');
        return;
      }

      if (onSuccess) {
        onSuccess(json.data.id);
      } else {
        const dashboardBasePath = pathname.startsWith('/lawyer') ? '/lawyer/dashboard' : '/client/dashboard';
        router.push(`${dashboardBasePath}/cases`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Network error. Please check your connection and try again.');
      setFormState('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <FormHeader />
      
      <MetadataFields
        formData={formData}
        onChange={handleFieldChange}
        disabled={isSubmitting}
      />
      
      <DetailFields
        formData={formData}
        onChange={handleFieldChange}
        disabled={isSubmitting}
      />

      <FormActions
        isSubmitting={isSubmitting}
        isValid={Boolean(isFormValid)}
        errorMessage={formState === 'error' ? errorMessage : ''}
        onCancel={() => router.back()}
      />
    </form>
  );
}
