import ContentSection from '@/components/student/app/settings/shared/content-section';
import AccountForm from '@/components/student/app/settings/account/account-form';

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
