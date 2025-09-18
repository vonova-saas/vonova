import {
  Bell,
  BookOpen,
  Combine,
  Gauge,
  LifeBuoy,
  MonitorCog,
  Send,
  Settings2,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react";

export const sidebarNavData = {
  adminData: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
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
    {
      title: "Logging & Monitoring",
      url: "/admin/:adminId/logging-monitoring",
      icon: Combine
    },
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
      title: "Reports",
      url: "/admin/:adminId/reports",
      icon: BookOpen
    },
    {
      title: "Support Management",
      url: "/admin/:adminId/support-management",
      icon: LifeBuoy
    },
    {
      title: "Feedback Management",
      url: "/admin/:adminId/feedback-management",
      icon: Send
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
      title: "Billing",
      url: "/admin/:adminId/settings/billing",
      icon: Wallet,
    },
    {
      title: "Notifications",
      url: "/admin/:adminId/settings/notifications",
      icon: Bell,
    },
  ],
};
