import ContentSection from '@/components/instructor/app/settings/shared/content-section';
import SettingsForm from '@/components/instructor/app/settings/settings/settings-form';

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