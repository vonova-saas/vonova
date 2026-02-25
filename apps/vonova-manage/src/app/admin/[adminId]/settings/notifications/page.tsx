import ContentSection from '@/components/admin/dashboard/settings/shared/content-section';
import NotificationsForm from '@/components/admin/dashboard/settings/notifications/notifications-form';

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
