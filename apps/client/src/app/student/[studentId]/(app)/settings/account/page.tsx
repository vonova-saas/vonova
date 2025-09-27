import ContentSection from '@/components/shared/settings/shared/content-section';
import AccountForm from '@/components/shared/settings/account/account-form';

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
