import { Input } from '@/components/ui/input';
import { CaseFormData } from './types';

interface MetadataFieldsProps {
  formData: CaseFormData;
  onChange: (field: keyof CaseFormData, value: string) => void;
  disabled: boolean;
}

export function MetadataFields({ formData, onChange, disabled }: MetadataFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label htmlFor="category" className="text-sm font-semibold text-slate-900">
          Practice Area <span className="text-rose-500" aria-hidden>*</span>
        </label>
        <select
          id="category"
          required
          value={formData.category}
          onChange={(e) => onChange('category', e.target.value)}
          disabled={disabled}
          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="" disabled>Select a category...</option>
          <option value="Family Law">Family Law</option>
          <option value="Criminal Defense">Criminal Defense</option>
          <option value="Corporate/Business">Corporate/Business</option>
          <option value="Property/Real Estate">Property/Real Estate</option>
          <option value="Civil Litigation">Civil Litigation</option>
          <option value="Immigration">Immigration</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="urgency" className="text-sm font-semibold text-slate-900">
          Urgency <span className="text-rose-500" aria-hidden>*</span>
        </label>
        <select
          id="urgency"
          required
          value={formData.urgency}
          onChange={(e) => onChange('urgency', e.target.value)}
          disabled={disabled}
          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="Standard">Standard</option>
          <option value="Urgent (Action < 30 days)">Urgent (Action &lt; 30 days)</option>
          <option value="Emergency (Immediate)">Emergency (Immediate)</option>
        </select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <label htmlFor="jurisdiction" className="text-sm font-semibold text-slate-900">
          Jurisdiction / District <span className="text-rose-500" aria-hidden>*</span>
        </label>
        <Input
          id="jurisdiction"
          type="text"
          required
          placeholder="e.g. Dhaka District Court, Supreme Court"
          value={formData.jurisdiction}
          onChange={(e) => onChange('jurisdiction', e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
