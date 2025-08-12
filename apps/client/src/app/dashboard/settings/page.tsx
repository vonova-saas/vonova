import ContentSection from '@/components/dashboard/settings/shared/content-section';
import SettingsForm from '@/components/dashboard/settings/settings/settings-form';

export default function SettingsPage() {
  return (
    <ContentSection
      title='Settings'
      desc='Update your settings.'
    >
      <SettingsForm />
    </ContentSection>
  );
} 