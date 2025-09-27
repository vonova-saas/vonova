"use client";

import * as React from "react";

import { NavMain } from "@/components/student/main/nav-main";
import { NavStudent } from "@/components/student/main/nav-student";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { sidebarNavData } from "./sidebar-nav-config";
import Image from "next/image";
import { useUserId } from "@/hooks";
import { NavSubMain } from "./nav-sub-main";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const userId = useUserId();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href={userId ? `/${userId}` : "/student"}>
                <div className="bg-muted text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image
                    src="/icons/icon.png"
                    alt="Vonova Logo"
                    width={24}
                    height={24} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Vonova</span>
                  <span className="truncate text-xs">
                    {
                      sidebarNavData.roles[
                      "student" as keyof typeof sidebarNavData.roles
                      ]
                    }
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarNavData.lms}/>
        <NavSubMain items={sidebarNavData.app} title="App" />
      </SidebarContent>
      <SidebarFooter>
        <NavStudent student={sidebarNavData.studentData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
