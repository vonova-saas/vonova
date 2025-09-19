"use client";

import * as React from "react";

import { NavMain } from "@/components/admin/dashboard/main/nav-main";
import { NavAdmin } from "@/components/admin/dashboard/main/nav-admin";
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
import useAdminId from "@/hooks/admin/use-admin-id";
import { NavSubMain } from "./nav-sub-main";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const adminId = useAdminId();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href={adminId ? `/admin/${adminId}` : "/admin"}>
                <div className="bg-muted text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image
                    src="/icons/icon.png"
                    alt="Vonova Logo"
                    width={24}
                    height={24} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Onyx Tap</span>
                  <span className="truncate text-xs">
                    {
                      sidebarNavData.roles[
                      "admin" as keyof typeof sidebarNavData.roles
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
        <NavMain items={sidebarNavData.adminDeveloper} groupTitle="Developer"/>
        <NavMain items={sidebarNavData.adminWebsiteOperations} groupTitle="Website Operations"/>
        <NavSubMain items={sidebarNavData.app} title="App" />
      </SidebarContent>
      <SidebarFooter>
        <NavAdmin admin={sidebarNavData.adminData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
