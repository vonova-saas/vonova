import CommunityStylePageShell from '@/components/shared/layout/community-style-page-shell';
import { SupportForm } from '@/components/shared/support/support-form';
import { LifeBuoy } from 'lucide-react';

export default function SupportPage() {
  return (
    <CommunityStylePageShell
      badgeLabel="Instructor hub"
      title="Support"
      description="Contact support, report issues, and request guidance for your instructor workflows."
      icon={LifeBuoy}
      stats={[
        { label: "Section", value: "Help Desk" },
        { label: "Mode", value: "Instructor" },
        { label: "Status", value: "Online" },
      ]}
    >
      <div className="space-y-8">
        <SupportForm />
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