"use client";

import * as React from "react";
import { Sidebar, SidebarContent, SidebarRail } from "@/components/ui/sidebar";
// import { X } from "lucide-react"

export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar side="right" collapsible="offcanvas" {...props}>
      <SidebarContent className="flex-1 flex items-center justify-center">
        <h1 className="text-2xl font-bold text-center w-full">Hello</h1>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
