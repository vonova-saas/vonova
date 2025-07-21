"use client";

import * as React from "react";

import { NavMain } from "@/components/dashboard/main/nav-main";
import { NavUser } from "@/components/dashboard/main/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUserRole } from "@/hooks/use-user-role";
import { sidebarNavData } from "./sidebar-nav-config";
import Image from "next/image";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const role = useUserRole();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-3 mt-2">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            {/* <Command className="size-4" /> */}
            <Image
              src="/icons/icon.png"
              width={24}
              height={24}
              alt="vonova logo"
            />
          </div>
          {state !== "collapsed" && (
            <div className="flex flex-col">
              <span className="font-semibold text-base leading-tight">
                Vonova
              </span>
              <span className="text-xs text-muted-foreground">
                {
                  sidebarNavData.roles[
                    role as keyof typeof sidebarNavData.roles
                  ]
                }
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={sidebarNavData[role as never] || sidebarNavData["student"]}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarNavData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
