import {
  BookOpen,
  BrainCog,
  LayoutDashboard,
  Settings2,
  SquareTerminal,
  User,
  LifeBuoy,
  Send,
  Presentation,
  Video,
  Frame
} from "lucide-react";

export const sidebarNavData = {
  instructorData: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
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
      icon: SquareTerminal
    },
    {
      title: "Material Library Management",
      url: "/instructor/:instructorId/material-library-management",
      icon: BookOpen,
    },
    {
      title: "Problem Solving Management",
      url: "/instructor/:instructorId/problem-solving-management",
      icon: BrainCog,
    },
    {
      title: "Community",
      url: "/instructor/:instructorId/community",
      icon: Frame,
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
    }
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
    {
      title: "Feedback",
      url: "/instructor/:instructorId/feedback",
      icon: Send,
    },
  ],
};
