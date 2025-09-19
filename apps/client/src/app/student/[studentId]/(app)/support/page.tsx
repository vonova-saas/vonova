import { SupportForm } from '@/components/student/app/support/support-form';

export default function SupportPage() {
  return (
    <div className="container py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
        <p className="text-muted-foreground">
          Get help with NFC card operations, account issues, and more.
        </p>
      </div>

      <div className="space-y-12">
        <SupportForm />
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Can&apos;t find what you&apos;re looking for? Email us at <a href="mailto:support@onyx.com" className="text-primary hover:underline">support@onyx.com</a></p>
      </div>
    </div>
  );
}