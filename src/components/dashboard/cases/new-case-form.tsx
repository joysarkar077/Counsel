'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CaseFormData } from './new-case-form/types';
import { FormHeader } from './new-case-form/form-header';
import { MetadataFields } from './new-case-form/metadata-fields';
import { DetailFields } from './new-case-form/detail-fields';
import { FormActions } from './new-case-form/form-actions';

export interface NewCaseFormProps {
  /** Called after a successful submission with the new case id. */
  onSuccess?: (id: string) => void;
}

type FormState = 'idle' | 'submitting' | 'error';

export function NewCaseForm({ onSuccess }: NewCaseFormProps) {
  const router = useRouter();
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
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
        router.push('/dashboard/cases');
      }
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.');
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
