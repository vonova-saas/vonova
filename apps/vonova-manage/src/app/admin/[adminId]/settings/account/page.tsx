import ContentSection from '@/components/admin/dashboard/settings/shared/content-section';
import AccountForm from '@/components/admin/dashboard/settings/account/account-form';
import { AdminResetPasswordForm } from '@/components/admin/auth/reset-password/admin-reset-password-form';

export default function SettingsAccount() {
  return (
    <ContentSection
      title='Account'
      desc='Profile and password.'
    >
      <div className='space-y-10'>
        <AccountForm />
        <AdminResetPasswordForm />
      </div>
    </ContentSection>
  );
}
