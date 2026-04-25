"use client";

import dynamic from "next/dynamic";

// Client-only: extensions inject attrs (e.g. fdprocessedid) before hydration.
const DashboardLayoutClient = dynamic(() => import("./dashboard-layout-client"), {
  ssr: false,
  loading: () => (
    <div
      className="flex min-h-screen w-full bg-background"
      aria-busy
      aria-label="Loading dashboard"
    />
  ),
});

export function AdminDashboardLayoutDynamic({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
