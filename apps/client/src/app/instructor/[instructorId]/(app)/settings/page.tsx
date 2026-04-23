import CommunityStylePageShell from '@/components/shared/layout/community-style-page-shell';
import SettingsForm from '@/components/shared/settings/settings/settings-form';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <CommunityStylePageShell
      badgeLabel="Instructor hub"
      title="Settings"
      description="Control your workspace preferences and tailor the platform behavior to your teaching workflow."
      icon={Settings}
      stats={[
        { label: "Section", value: "General" },
        { label: "Mode", value: "Instructor" },
        { label: "Status", value: "Active" },
      ]}
    >
      <SettingsForm />
    </CommunityStylePageShell>
  );
} 