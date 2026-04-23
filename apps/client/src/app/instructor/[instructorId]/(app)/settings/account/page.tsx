import CommunityStylePageShell from '@/components/shared/layout/community-style-page-shell';
import AccountForm from '@/components/shared/settings/account/account-form';
import { UserRound } from 'lucide-react';

export default function SettingsAccount() {
  return (
    <CommunityStylePageShell
      badgeLabel="Instructor hub"
      title="Account"
      description="Manage personal and profile information."
      icon={UserRound}
      stats={[
        { label: "Section", value: "Profile" },
        { label: "Mode", value: "Instructor" },
        { label: "Status", value: "Active" },
      ]}
    >
      <AccountForm />
    </CommunityStylePageShell>
  );
}
