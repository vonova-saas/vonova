import {
  BookOpen,
  ClipboardCheck,
  BrainCog,
  LayoutDashboard,
  Settings2,
  SquareTerminal,
  User,
  LifeBuoy,
  Presentation,
  Video,
  Frame,
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
  instructorData: {
    name: string;
    email: string;
    avatar: string;
  };
  roles: {
    instructor: string;
  };
  lmsManagement: NavItem[];
  lmsTools: NavItem[];
  app: NavItem[];
}

export const sidebarNavData: SidebarNavData = {
  instructorData: {
    name: "",
    email: "",
    avatar: "",
  },
  roles: {
    instructor: "Instructor"
  },
  lmsManagement: [
    {
      title: "Dashboard",
      url: "/instructor/:instructorId",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Courses Management",
      url: "/instructor/:instructorId/courses-management",
      icon: SquareTerminal,
    },
    {
      title: "Material Library Management",
      url: "/instructor/:instructorId/material-library-management",
      icon: BookOpen,
    },
    {
      title: "Quiz Management",
      url: "/instructor/:instructorId/quiz-managment",
      icon: ClipboardCheck,
    },
    {
      title: "Problem Solving Management",
      url: "/instructor/:instructorId/problem-solving-management",
      icon: BrainCog,
    },
    {
      // Realtime social hub. Role-agnostic top-level route — no :instructorId
      // substitution needed.
      title: "Community",
      url: "/community",
      icon: Frame,
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
  ],
  lmsTools: [
    {
      title: "Presentation Builder",
      url: "/instructor/:instructorId/presentation-builder",
      icon: Presentation,
    },
    {
      title: "Course Recorder",
      url: "/instructor/:instructorId/course-recorder",
      icon: Video,
    },
  ],
  app: [
    {
      title: "Settings",
      url: "/instructor/:instructorId/settings",
      icon: Settings2,
    },
    {
      title: "Account",
      url: "/instructor/:instructorId/settings/account",
      icon: User,
    },
    {
      title: "Support",
      url: "/instructor/:instructorId/support",
      icon: LifeBuoy,
    },
  ],
};
