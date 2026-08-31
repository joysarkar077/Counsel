import { Input } from '@/components/ui/input';
import { CaseFormData } from './types';

interface DetailFieldsProps {
  formData: CaseFormData;
  onChange: (field: keyof CaseFormData, value: string) => void;
  disabled: boolean;
}

export function DetailFields({ formData, onChange, disabled }: DetailFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <label htmlFor="case-title" className="text-sm font-semibold text-slate-900 flex justify-between">
          <span>Case Title <span className="text-rose-500" aria-hidden>*</span></span>
          <span className="text-xs font-normal text-slate-500">{formData.title.length}/200</span>
        </label>
        <Input
          id="case-title"
          type="text"
          required
          maxLength={200}
          placeholder="e.g. Property Dispute — Smith vs. Johnson"
          value={formData.title}
          onChange={(e) => onChange('title', e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="opposingParty" className="text-sm font-semibold text-slate-900">
            Opposing Party Name <span className="text-rose-500" aria-hidden>*</span>
          </label>
          <Input
            id="opposingParty"
            type="text"
            required
            placeholder="Name of opposing person/company"
            value={formData.opposingParty}
            onChange={(e) => onChange('opposingParty', e.target.value)}
            disabled={disabled}
          />
          <p className="text-[11px] text-slate-500">Required for conflict of interest checks.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="claimValue" className="text-sm font-semibold text-slate-900">
            Estimated Claim Value <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <Input
            id="claimValue"
            type="text"
            placeholder="e.g. 50,000 BDT or N/A"
            value={formData.claimValue}
            onChange={(e) => onChange('claimValue', e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="case-description" className="text-sm font-semibold text-slate-900">
          Description <span className="text-rose-500" aria-hidden>*</span>
        </label>
        <textarea
          id="case-description"
          required
          rows={6}
          placeholder="Describe the nature of your legal issue in as much detail as possible…"
          value={formData.description}
          onChange={(e) => onChange('description', e.target.value)}
          disabled={disabled}
          className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[120px] resize-y"
        />
      </div>
    </>
  );
}
