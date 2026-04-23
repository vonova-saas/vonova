import CommunityStylePageShell from '@/components/shared/layout/community-style-page-shell';
import SettingsForm from '@/components/shared/settings/settings/settings-form';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <CommunityStylePageShell
      badgeLabel="Student hub"
      title="Settings"
      description="Manage preferences, language, and accessibility options to personalize your learning experience."
      icon={Settings}
      stats={[
        { label: "Section", value: "General" },
        { label: "Mode", value: "Student" },
        { label: "Status", value: "Active" },
      ]}
    >
      <SettingsForm />
    </CommunityStylePageShell>
  );
} 