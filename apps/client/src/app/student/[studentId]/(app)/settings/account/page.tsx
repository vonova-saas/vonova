import ContentSection from '@/components/shared/settings/shared/content-section';
import AccountForm from '@/components/shared/settings/account/account-form';

export default function SettingsAccount() {
  return (
    <ContentSection
      title='Account'
      desc=""
    >
      <AccountForm />
    </ContentSection>
  );
}
