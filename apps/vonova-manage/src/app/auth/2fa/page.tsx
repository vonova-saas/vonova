import { Admin2FAForm } from "@/components/admin/auth/2fa/admin-2fa-form";

export default function TwoFAPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="absolute inset-0 bg-[url('/images/auth/grid.svg')] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      <div className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">

          <div className="animate-in fade-in-0 zoom-in-95">
            <Admin2FAForm />
          </div>

          <div className="mt-8 text-center text-xs text-gray-500 space-y-2">
            <p>For your security, please complete two-factor authentication to continue.</p>
            <p>If you didn&apos;t request this, please contact your system administrator.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
