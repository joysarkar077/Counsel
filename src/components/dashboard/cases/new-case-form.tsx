'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CaseFormData } from './new-case-form/types';
import { FormHeader } from './new-case-form/form-header';
import { MetadataFields } from './new-case-form/metadata-fields';
import { DetailFields } from './new-case-form/detail-fields';
import { FormActions } from './new-case-form/form-actions';
import { generateKeyPair, encrypt, type ECIESCiphertext } from '@/lib/crypto/ecc';

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
      // 1. Fetch the ECC public keys for authorized recipients (creator + admins)
      const [adminKeysRes, myKeyRes] = await Promise.all([
        fetch('/api/admin/public-keys'),
        fetch('/api/user/me/public-key')
      ]);

      const adminKeysJson = await adminKeysRes.json();
      const myKeyJson = await myKeyRes.json();

      if (!adminKeysRes.ok || !myKeyRes.ok) {
        throw new Error('Failed to fetch encryption keys from the server.');
      }

      // 2. Generate a per-case ECC keypair.
      //    All case fields are encrypted to the case public key.
      //    The case private scalar is distributed via accessKeys.
      const caseKeyPair = generateKeyPair();

      // 3. Distribute the case private scalar to all authorized users.
      //    Each user receives an ECIES bundle encrypting the scalar to their ECC public key.
      const accessKeys: { userId: string; encryptedCaseKey: string }[] = [];
      const addedUsers = new Set<string>();

      // Wrap for the creator (the submitting user)
      const myECCPublicKey: string = myKeyJson.data.publicKey; // 'x,y' hex ECC key
      accessKeys.push({
        userId: myKeyJson.data.userId,
        encryptedCaseKey: JSON.stringify(encrypt(caseKeyPair.privateKey, myECCPublicKey)),
      });
      addedUsers.add(myKeyJson.data.userId);

      // Wrap for all admins
      for (const admin of adminKeysJson.data) {
        if (!addedUsers.has(admin.userId)) {
          const adminECCPublicKey: string = admin.publicKey;
          accessKeys.push({
            userId: admin.userId,
            encryptedCaseKey: JSON.stringify(encrypt(caseKeyPair.privateKey, adminECCPublicKey)),
          });
          addedUsers.add(admin.userId);
        }
      }

      // 4. Encrypt all case fields with ECIES to the case public key.
      //    Each call to encrypt() generates a fresh ephemeral keypair → distinct bundles.
      const encField = (value: string): string =>
        JSON.stringify(encrypt(value, caseKeyPair.publicKey));

      const payload = {
        casePublicKey: caseKeyPair.publicKey,
        title_enc: encField(formData.title),
        description_enc: encField(formData.description),
        opposingParty_enc: encField(formData.opposingParty),
        claimValue_enc: formData.claimValue ? encField(formData.claimValue) : '',
        category_enc: encField(formData.category),
        urgency_enc: encField(formData.urgency),
        jurisdiction_enc: encField(formData.jurisdiction),
        accessKeys,
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
