import ContentSection from '@/components/dashboard/settings/shared/content-section';
import AccountForm from '@/components/dashboard/settings/account/account-form';

export default function SettingsAccount() {
  return (
    <ContentSection
      title='Account'
      desc='Update your account settings. Set your preferred language and
            timezone.'
    >
      <AccountForm />
    </ContentSection>
  );
}
