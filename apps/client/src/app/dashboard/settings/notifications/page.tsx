
import ContentSection from '@/components/dashboard/settings/shared/content-section';
import NotificationsForm from '@/components/dashboard/settings/notifications/notifications-form';

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
