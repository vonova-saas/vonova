
import ContentSection from '@/components/instructor/app/settings/shared/content-section';
import NotificationsForm from '@/components/instructor/app/settings/notifications/notifications-form';

export default function SettingsNotifications() {
  return (
    <ContentSection
      title='Notifications'
      desc='Configure how you receive notifications.'
    >
      <NotificationsForm />
    </ContentSection>
  );
}
