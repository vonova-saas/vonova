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
  Zap,
  LifeBuoy,
  Send,
  User,
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
      url: "/:studentId",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Courses",
      url: "/:studentId/courses",
      icon: SquareTerminal,
    },
    {
      title: "Material Library",
      url: "/:studentId/material-library",
      icon: BookOpen,
    },
    {
      title: "Quizzes",
      url: "/:studentId/quizzes",
      icon: Component,
    },
    {
      title: "Community",
      url: "/:studentId/community",
      icon: Frame,
    },
    {
      title: "PDF Summary",
      url: "/:studentId/pdf-summary",
      icon: FileText,
    },
    {
      title: "AI Video Generator",
      url: "/:studentId/ai-video-generator",
      icon: TvMinimalPlay,
    },
    {
      title: "AI Roadmap Generator",
      url: "/:studentId/ai-roadmap-generator",
      icon: Zap,
    },
    {
      title: "Problem Solving",
      url: "/:studentId/problem-solving",
      icon: BrainCog,
    },
    {
      title: "AI Assistant",
      url: "/:studentId/ai-assistant",
      icon: Bot,
    },
  ],
  app: [
    {
      title: "Settings",
      url: "/:studentId/settings",
      icon: Settings2,
    },
    {
      title: "Account",
      url: "/:studentId/settings/account",
      icon: User,
    },
    {
      title: "Support",
      url: "/:studentId/support",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "/:studentId/feedback",
      icon: Send,
    },
  ],
};
