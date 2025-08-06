import {
  BookOpen,
  Bot,
  BrainCog,
  Component,
  FileText,
  Frame,
  LayoutDashboard,
  Presentation,
  Settings2,
  SquareTerminal,
  TvMinimalPlay,
  User,
  UserCog,
  Zap,
} from "lucide-react";

export const sidebarNavData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  roles: {
    student: "Student",
    admin: "Admin",
    instructor: "Instructor"
  },
  student: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Courses",
      url: "/dashboard/courses",
      icon: SquareTerminal,
    },
    {
      title: "Material Library",
      url: "/dashboard/material-library",
      icon: BookOpen,
    },
    {
      title: "PDF Summary",
      url: "/dashboard/pdf-summary",
      icon: FileText,
    },
    {
      title: "Quizzes",
      url: "/dashboard/quizzes",
      icon: Component,
    },
    {
      title: "AI Video Generator",
      url: "/dashboard/ai-video-generator",
      icon: TvMinimalPlay,
    },
    {
      title: "AI Roadmap Generator",
      url: "/dashboard/ai-roadmap-generator",
      icon: Zap,
    },
    {
      title: "Problem Solving",
      url: "/dashboard/problem-solving",
      icon: BrainCog,
    },
    {
      title: "AI Assistant",
      url: "/dashboard/ai-assistant",
      icon: Bot,
    },
    {
      title: "Community",
      url: "/dashboard/community",
      icon: Frame,
    },
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: UserCog,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/dashboard/settings/general",
        },
        {
          title: "Billing",
          url: "/dashboard/settings/billing",
        },
      ],
    },
  ],
  admin: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "User Management",
      url: "/dashboard/user-management",
      icon: User
    },
    {
      title: "Reports",
      url: "/dashboard/reports",
      icon: BookOpen
    },
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: UserCog,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/dashboard/settings/general",
        },
        {
          title: "Billing",
          url: "/dashboard/settings/billing",
        },
      ],
    },
  ],
  instructor: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    { title: "Courses Management", url: "/dashboard/courses-management", icon: SquareTerminal },
    {
      title: "Material Library Management",
      url: "/dashboard/material-library-management",
      icon: BookOpen,
    },
    {
      title: "Presentation Builder",
      url: "/dashboard/presentation-builder",
      icon: Presentation,
    },
    {
      title: "Problem Solving Management",
      url: "/dashboard/problem-solving-management",
      icon: BrainCog,
    },
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: UserCog,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/dashboard/settings/general",
        },
        {
          title: "Billing",
          url: "/dashboard/settings/billing",
        },
      ],
    },
  ],
};
