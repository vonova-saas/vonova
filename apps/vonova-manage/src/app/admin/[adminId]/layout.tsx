import { AdminDashboardLayoutDynamic } from "./admin-dashboard-layout-dynamic";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminDashboardLayoutDynamic>{children}</AdminDashboardLayoutDynamic>;
}
