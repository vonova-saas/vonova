"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  BrainCog,
  Command,
  Component,
  Frame,
  GalleryVerticalEnd,
  LayoutDashboard,
  // Map,
  // PieChart,
  Settings2,
  SquareTerminal,
  TvMinimalPlay,
  Zap,
} from "lucide-react";

import { NavMain } from "@/components/dashboard/main/nav-main";
// import { NavProjects } from "@/components/dashboard/nav-projects";
import { NavUser } from "@/components/dashboard/main/nav-user";
import { TeamSwitcher } from "@/components/dashboard/main/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
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
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/dashboard/settings/general",
        },
        {
          title: "Team",
          url: "/dashboard/settings/team",
        },
        {
          title: "Billing",
          url: "/dashboard/settings/billing",
        },
        {
          title: "Limits",
          url: "/dashboard/settings/limits",
        },
      ],
    },
  ],
  // projects: [
  //   {
  //     name: "Design Engineering",
  //     url: "#",
  //     icon: Frame,
  //   },
  //   {
  //     name: "Sales & Marketing",
  //     url: "#",
  //     icon: PieChart,
  //   },
  //   {
  //     name: "Travel",
  //     url: "#",
  //     icon: Map,
  //   },
  // ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
