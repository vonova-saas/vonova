import ContentSection from '@/components/admin/dashboard/settings/shared/content-section';
import SettingsForm from '@/components/admin/dashboard/settings/settings/settings-form';

export default function SettingsPage() {
  return (
    <ContentSection
      title='Settings'
      desc=''
    >
      <SettingsForm />
    </ContentSection>
  );
} 