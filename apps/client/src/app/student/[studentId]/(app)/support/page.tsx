import CommunityStylePageShell from '@/components/shared/layout/community-style-page-shell';
import { SupportForm } from '@/components/shared/support/support-form';
import { SupportList } from '@/components/shared/support/support-list';
import { LifeBuoy } from 'lucide-react';

export default function SupportPage() {
  return (
    <CommunityStylePageShell
      badgeLabel="Student hub"
      title="Support"
      description="Reach out for help, submit tickets, and track support requests in one place."
      icon={LifeBuoy}
      stats={[
        { label: "Section", value: "Help Desk" },
        { label: "Mode", value: "Student" },
        { label: "Status", value: "Online" },
      ]}
    >
      <div className="space-y-8">
        <SupportForm />
        <SupportList />
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Can&apos;t find what you&apos;re looking for? Email us at{" "}
            <a href="mailto:support@onyx.com" className="text-primary hover:underline">
              support@onyx.com
            </a>
          </p>
        </div>
      </div>
    </CommunityStylePageShell>
  );
}