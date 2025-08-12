import ContentSection from "@/components/dashboard/settings/shared/content-section";
import { BillingForm } from "@/components/dashboard/settings/billing/billing-form";

export default function BillingPage() {
  return (
    <ContentSection
      title="Billing"
      desc="Update your billing information and manage your subscription."
    >
      <BillingForm />
    </ContentSection>
  );
}