"use client";

import * as React from "react";
import Link from "next/link";

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
  const withStudentId = (url: string) => url.replace(":studentId", userId);
  const lmsItems = sidebarNavData.lms.map((item) => ({
    ...item,
    url: withStudentId(item.url),
    items: item.items?.map((subItem) => ({
      ...subItem,
      url: withStudentId(subItem.url),
    })),
  }));

  const appItems = sidebarNavData.app.map((item) => ({
    ...item,
    url: withStudentId(item.url),
    items: item.items?.map((subItem) => ({
      ...subItem,
      url: withStudentId(subItem.url),
    })),
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={userId ? `/student/${userId}` : "/student"}>
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
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={lmsItems} />
        <NavSubMain items={appItems} title="App" />
      </SidebarContent>
      <SidebarFooter>
        <NavStudent student={sidebarNavData.studentData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
