
import ContentSection from '@/components/student/app/settings/shared/content-section';
import NotificationsForm from '@/components/student/app/settings/notifications/notifications-form';

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
