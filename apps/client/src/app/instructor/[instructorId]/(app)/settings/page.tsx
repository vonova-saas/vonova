import ContentSection from '@/components/shared/settings/shared/content-section';
import SettingsForm from '@/components/shared/settings/settings/settings-form';

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