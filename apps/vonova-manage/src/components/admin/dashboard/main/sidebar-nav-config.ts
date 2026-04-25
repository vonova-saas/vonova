import {
  Bell,
  Combine,
  Gauge,
  LifeBuoy,
  MonitorCog,
  Settings2,
  ShieldCheck,
  User,
} from "lucide-react";

// Check if admin logs are disabled (client-side check)
const isAdminLogsDisabled = process.env.NEXT_PUBLIC_HIDE_ADMIN_LOGS === 'true';

export const sidebarNavData = {
  adminData: {
    name: "Admin",
    email: "",
    avatar: "",
  },
  roles: {
    admin: "Admin"
  },
  adminDeveloper: [
    {
      title: "System Overview",
      url: "/admin/:adminId",
      icon: MonitorCog,
      isActive: true,
    },
    ...(isAdminLogsDisabled ? [] : [
      {
        title: "Logging & Monitoring",
        url: "/admin/:adminId/logging-monitoring",
        icon: Combine
      }
    ]),
    {
      title: "Security Logs",
      url: "/admin/:adminId/security-logs",
      icon: ShieldCheck
    },
    {
      title: "Performance Metrics",
      url: "/admin/:adminId/performance-metrics",
      icon: Gauge
    },
  ],
  adminWebsiteOperations: [
    {
      title: "User Management",
      url: "/admin/:adminId/user-management",
      icon: User
    },
    {
      title: "Support Management",
      url: "/admin/:adminId/support-management",
      icon: LifeBuoy
    },
  ],
  app: [
    {
      title: "Settings",
      url: "/admin/:adminId/settings",
      icon: Settings2,
    },
    {
      title: "Account",
      url: "/admin/:adminId/settings/account",
      icon: User,
    },
    {
      title: "Notifications",
      url: "/admin/:adminId/settings/notifications",
      icon: Bell,
    },
  ],
};
