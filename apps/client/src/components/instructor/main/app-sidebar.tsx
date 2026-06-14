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
import { usePathname } from "next/navigation";
import { NavSubMain } from "./nav-sub-main";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const auth = useAuthContextOptional();
  // Prefer the authenticated user's id so the sidebar keeps working on
  // role-agnostic routes (e.g. /community/*) where pathname segment [2] is
  // not a Mongo id. Fall back to the URL segment for SSR / pre-auth paints.
  const pathId = pathname?.split("/")[2] ?? "";
  const looksLikeId = /^[a-f0-9]{24}$/i.test(pathId);
  const userId =
    (auth?.user?._id as string | undefined) || (looksLikeId ? pathId : "");
  const withInstructorId = (url: string) => url.replace(":instructorId", userId);

  const lmsManagementItems = sidebarNavData.lmsManagement.map((item) => ({
    ...item,
    url: withInstructorId(item.url),
    items: item.items?.map((subItem) => ({
      ...subItem,
      url: withInstructorId(subItem.url),
    })),
  }));

  const lmsToolsItems = sidebarNavData.lmsTools.map((item) => ({
    ...item,
    url: withInstructorId(item.url),
    items: item.items?.map((subItem) => ({
      ...subItem,
      url: withInstructorId(subItem.url),
    })),
  }));

  const appItems = sidebarNavData.app.map((item) => ({
    ...item,
    url: withInstructorId(item.url),
    items: item.items?.map((subItem) => ({
      ...subItem,
      url: withInstructorId(subItem.url),
    })),
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
