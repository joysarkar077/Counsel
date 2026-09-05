import { ChangePasswordForm } from '@/components/dashboard/settings/ChangePasswordForm';

export const metadata = {
  title: 'Settings - Counsel',
};

export default function ClientSettingsPage() {
  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-navy-deepest tracking-tight mb-2">Settings</h1>
        <p className="text-text-muted">Manage your account security and preferences.</p>
      </div>

      <div className="space-y-6">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
