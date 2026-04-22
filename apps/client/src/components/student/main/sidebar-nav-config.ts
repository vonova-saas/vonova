import {
  BookOpen,
  Component,
  FileText,
  LayoutDashboard,
  Settings2,
  SquareTerminal,
  Zap,
  LifeBuoy,
  User,
  BrainCog,
  Users,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  items?: NavSubItem[];
}

export interface NavSubItem {
  title: string;
  url: string;
}

export interface SidebarNavData {
  studentData: {
    name: string;
    email: string;
    avatar: string;
  };
  roles: {
    student: string;
  };
  lms: NavItem[];
  app: NavItem[];
}

export const sidebarNavData: SidebarNavData = {
  studentData: {
    name: "",
    email: "",
    avatar: "",
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
      icon: Users,
      items: [
        {
          title: "Articles",
          url: "/student/:studentId/community/articles",
        },
        {
          title: "Feed",
          url: "/student/:studentId/community",
        },
      ],
    },
    {
      title: "PDF Summary",
      url: "/student/:studentId/pdf-summary",
      icon: FileText,
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
      title: "Support",
      url: "/student/:studentId/support",
      icon: LifeBuoy,
    },
  ],
};
