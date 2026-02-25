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
      url: "/:adminId",
      icon: MonitorCog,
      isActive: true,
    },
    {
      title: "Logging & Monitoring",
      url: "/:adminId/logging-monitoring",
      icon: Combine
    },
    {
      title: "Security Logs",
      url: "/:adminId/security-logs",
      icon: ShieldCheck
    },
    {
      title: "Performance Metrics",
      url: "/:adminId/performance-metrics",
      icon: Gauge
    },
  ],
  adminWebsiteOperations: [
    {
      title: "User Management",
      url: "/:adminId/user-management",
      icon: User
    },
    {
      title: "Reports",
      url: "/:adminId/reports",
      icon: BookOpen
    },
    {
      title: "Support Management",
      url: "/:adminId/support-management",
      icon: LifeBuoy
    },
    {
      title: "Feedback Management",
      url: "/:adminId/feedback-management",
      icon: Send
    },
  ],
  app: [
    {
      title: "Settings",
      url: "/:adminId/settings",
      icon: Settings2,
    },
    {
      title: "Account",
      url: "/:adminId/settings/account",
      icon: User,
    },
    {
      title: "Notifications",
      url: "/:adminId/settings/notifications",
      icon: Bell,
    },
  ],
};
