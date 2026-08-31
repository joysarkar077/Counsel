import { Button } from '@/components/ui/button';

interface FormActionsProps {
  isSubmitting: boolean;
  isValid: boolean;
  errorMessage: string;
  onCancel: () => void;
}

export function FormActions({ isSubmitting, isValid, errorMessage, onCancel }: FormActionsProps) {
  return (
    <>
      {/* Error message */}
      {errorMessage && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
          {errorMessage}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="w-full sm:w-auto min-w-[160px]"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
              Submitting...
            </span>
          ) : (
            'Submit Case Request'
          )}
        </Button>
      </div>
    </>
  );
}
