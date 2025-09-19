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
      url: "/:instructorId",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Courses Management",
      url: "/:instructorId/courses-management",
      icon: SquareTerminal
    },
    {
      title: "Material Library Management",
      url: "/:instructorId/material-library-management",
      icon: BookOpen,
    },
    {
      title: "Problem Solving Management",
      url: "/:instructorId/problem-solving-management",
      icon: BrainCog,
    },
    {
      title: "Community",
      url: "/:instructorId/community",
      icon: Frame,
    },
  ],
  lmsTools: [
    {
      title: "Presentation Builder",
      url: "/:instructorId/presentation-builder",
      icon: Presentation,
    },
    {
      title: "Course Recorder",
      url: "/:instructorId/course-recorder",
      icon: Video,
    }
  ],
  app: [
    {
      title: "Settings",
      url: "/:instructorId/settings",
      icon: Settings2,
    },
    {
      title: "Account",
      url: "/:instructorId/settings/account",
      icon: User,
    },
    {
      title: "Support",
      url: "/:instructorId/support",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "/:instructorId/feedback",
      icon: Send,
    },
  ],
};
