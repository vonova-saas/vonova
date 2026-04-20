"use client";

import * as React from "react";
import Link from "next/link";

import { NavMain } from "@/components/instructor/main/nav-main";
import { NavInstructor } from "@/components/instructor/main/nav-instructor";
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

  const lmsManagementItems = sidebarNavData.lmsManagement.map((item) => ({
    ...item,
    url: item.url.replace(":instructorId", userId || ""),
  }));

  const lmsToolsItems = sidebarNavData.lmsTools.map((item) => ({
    ...item,
    url: item.url.replace(":instructorId", userId || ""),
  }));

  const appItems = sidebarNavData.app.map((item) => ({
    ...item,
    url: item.url.replace(":instructorId", userId || ""),
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={userId ? `/instructor/${userId}` : "/instructor"}>
                <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
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
                      "instructor" as keyof typeof sidebarNavData.roles
                      ]
                    }
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={lmsManagementItems} />
        <NavSubMain items={lmsToolsItems} title="LMS Tools" />
        <NavSubMain items={appItems} title="App" />
      </SidebarContent>
      <SidebarFooter>
        <NavInstructor instructor={sidebarNavData.instructorData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
