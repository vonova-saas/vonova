"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import useAdminId from "@/hooks/admin/use-admin-id";

export function NavMain({
  items,
  groupTitle,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  groupTitle: string;
}) {
  const pathname = usePathname();
  const adminId = useAdminId();

  // Function to add adminId to URL if it exists
  const getUrl = (url: string) => {
    if (!adminId) return "/admin";
    return url.replace(":adminId", adminId);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        {groupTitle}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasActiveSubItem = item.items?.some(
            (subItem) => pathname === getUrl(subItem.url),
          );

          const shouldBeOpen = item.isActive || hasActiveSubItem;
          const isActive = (adminId && pathname === getUrl(item.url));

          return item.items && item.items.length > 0 ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={shouldBeOpen}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <Link href={getUrl(item.url)}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={pathname === getUrl(item.url)}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </Link>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === getUrl(subItem.url)}
                        >
                          <Link href={getUrl(subItem.url)}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.url} className={isActive ? 'bg-muted rounded-md' : ''}>
              <Link href={getUrl(item.url)}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={pathname === getUrl(item.url)}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
