"use client";

import dynamic from "next/dynamic";

// Client-only: extensions (e.g. password managers) inject attrs like fdprocessedid before
// hydration; skipping SSR avoids server/client markup mismatches on this page.
const AdminOTPLoginForm = dynamic(
  () =>
    import("@/components/admin/auth/login/admin-otp-login-form").then(
      (m) => m.AdminOTPLoginForm,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full max-w-md min-h-[28rem] animate-pulse rounded-xl border bg-card/80 shadow-sm"
        aria-busy
        aria-label="Loading sign-in form"
      />
    ),
  },
);

export function AdminOTPLoginFormDynamic() {
  return <AdminOTPLoginForm />;
}
