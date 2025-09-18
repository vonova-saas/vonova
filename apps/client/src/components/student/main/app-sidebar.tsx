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
  useSidebar,
} from "@/components/ui/sidebar";
import { sidebarNavData } from "./sidebar-nav-config";
import Image from "next/image";
import useStudentId from "@/hooks/student/use-student-id";
import { NavSubMain } from "./nav-sub-main";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const studentId = useStudentId();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href={studentId ? `/student/${studentId}` : "/student"}>
                <div className="bg-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image
                    src="/icons/white_o_of_onyx_logo.png"
                    alt="Onyx Logo"
                    width={25}
                    height={25} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Onyx Tap</span>
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
        {/* <NavMain items={sidebarNavData.ailms}/> */}
        <NavSubMain items={sidebarNavData.app} title="App" />
      </SidebarContent>
      <SidebarFooter>
        <NavStudent student={sidebarNavData.studentData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
