import CommunityStylePageShell from '@/components/shared/layout/community-style-page-shell';
import AccountForm from '@/components/shared/settings/account/account-form';
import { UserRound } from 'lucide-react';

export default function SettingsAccount() {
  return (
    <CommunityStylePageShell
      badgeLabel="Student hub"
      title="Account"
      description="Update your profile details and keep your account information accurate and up to date."
      icon={UserRound}
      stats={[
        { label: "Section", value: "Profile" },
        { label: "Mode", value: "Student" },
        { label: "Status", value: "Active" },
      ]}
    >
      <AccountForm />
    </CommunityStylePageShell>
  );
}
