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
  Bell,
  MessageSquare,
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
      // Realtime social hub: feed, profiles, groups, chat, notifications.
      // The new /community route is role-agnostic so we don't substitute :studentId.
      title: "Community",
      url: "/community",
      icon: Users,
      items: [
        { title: "Feed", url: "/community" },
        { title: "Explore", url: "/community/explore" },
        { title: "Articles", url: "/community/articles" },
        { title: "Groups", url: "/community/groups" },
        { title: "Search", url: "/community/search" },
      ],
    },
    {
      title: "Messages",
      url: "/community/messages",
      icon: MessageSquare,
    },
    {
      title: "Notifications",
      url: "/community/notifications",
      icon: Bell,
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
