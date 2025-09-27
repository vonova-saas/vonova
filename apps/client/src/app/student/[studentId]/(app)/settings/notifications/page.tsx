
import ContentSection from '@/components/shared/settings/shared/content-section';
import NotificationsForm from '@/components/shared/settings/notifications/notifications-form';

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
