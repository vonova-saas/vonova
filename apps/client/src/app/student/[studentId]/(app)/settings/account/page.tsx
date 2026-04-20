import ContentSection from '@/components/shared/settings/shared/content-section';
import AccountForm from '@/components/shared/settings/account/account-form';

export default function SettingsAccount() {
  return (
    <ContentSection
      title='Account'
      desc="Update your name, bio, address, date of birth, and profile photo. Email is read-only here."
    >
      <AccountForm />
    </ContentSection>
  );
}
