import {
  BookOpen,
  Bot,
  BrainCog,
  Component,
  FileText,
  Frame,
  LayoutDashboard,
  Settings2,
  SquareTerminal,
  TvMinimalPlay,
  User,
  Zap,
  LifeBuoy,
  Send,
  Bell,
  Wallet,
} from "lucide-react";

export const sidebarNavData = {
  studentData: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  roles: {
    student: "Student",
  },
  lms: [
    {
      title: "Dashboard",
      url: "/student/:studentId",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Courses",
      url: "/student/:studentId/courses",
      icon: SquareTerminal,
    },
    {
      title: "Material Library",
      url: "/student/:studentId/material-library",
      icon: BookOpen,
    },
    {
      title: "Quizzes",
      url: "/student/:studentId/quizzes",
      icon: Component,
    },
    {
      title: "Community",
      url: "/student/:studentId/community",
      icon: Frame,
    },
  ],
  ailms: [
    {
      title: "PDF Summary",
      url: "/student/:studentId/pdf-summary",
      icon: FileText,
    },
    {
      title: "AI Video Generator",
      url: "/student/:studentId/ai-video-generator",
      icon: TvMinimalPlay,
    },
    {
      title: "AI Roadmap Generator",
      url: "/student/:studentId/ai-roadmap-generator",
      icon: Zap,
    },
    {
      title: "Problem Solving",
      url: "/student/:studentId/problem-solving",
      icon: BrainCog,
    },
    {
      title: "AI Assistant",
      url: "/student/:studentId/ai-assistant",
      icon: Bot,
    },
  ],
  app: [
    {
      title: "Settings",
      url: "/student/:studentId/settings",
      icon: Settings2,
    },
    {
      title: "Account",
      url: "/student/:studentId/settings/account",
      icon: User,
    },
    {
      title: "Billing",
      url: "/student/:studentId/settings/billing",
      icon: Wallet,
    },
    {
      title: "Notifications",
      url: "/student/:studentId/settings/notifications",
      icon: Bell,
    },
    {
      title: "Support",
      url: "/student/:studentId/support",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "/student/:studentId/feedback",
      icon: Send,
    },
  ],
};
