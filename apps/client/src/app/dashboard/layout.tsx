"use client";

import { AppSidebar } from "@/components/dashboard/main/app-sidebar";
// import { AppSidebarWithCustomIcons } from "@/components/dashboard/main/temp/app-sidebar-with-customicon";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  LeftSidebarTrigger,
  SidebarProvider,
  RightSidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, MessageSquare, SearchIcon } from "lucide-react";
// import { PanelRight } from "lucide-react";
import ChatSidebar from "@/components/dashboard/main/chat-sidebar";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { SidebarRight } from "@/components/dashboard/main/right-sidebar";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

const segmentNameMap: Record<string, string> = {
  dashboard: "Dashboard",
  courses: "Courses",
  "material-library": "Material Library",
  quizzes: "Quizzes",
  "ai-video-generator": "AI Video Generator",
  "ai-roadmap-generator": "AI Roadmap Generator",
  "problem-solving": "Problem Solving",
  "ai-assistant": "AI Assistant",
  voice: "AI Voice",
  community: "Community",
  settings: "Settings",
};

export default function DashboardLayout({ children }: Props) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const dashboardIndex = segments.indexOf("dashboard");
  const crumbSegments =
    dashboardIndex >= 0 ? segments.slice(dashboardIndex) : segments;

  const [open, setOpen] = React.useState(false);
  const [chatOpen, setChatOpen] = React.useState(false);
  // const [rightSidebarOpen, setRightSidebarOpen] = React.useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Dashboard sections for search
  const dashboardSections = [
    { name: "Dashboard", url: "/dashboard" },
    { name: "Playground", url: "/dashboard/playground" },
    { name: "Models", url: "/dashboard/models" },
    { name: "Documentation", url: "/dashboard/documentation" },
    { name: "Settings", url: "/dashboard/settings" },
  ];

  const [search, setSearch] = React.useState("");
  const filteredSections = dashboardSections.filter((section) =>
    section.name.toLowerCase().includes(search.toLowerCase()),
  );

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-1 min-w-0 flex-col">
          <ChatSidebar open={chatOpen} onClose={() => setChatOpen(false)} />
          <SidebarInset>
            <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b bg-muted/10 backdrop-blur-lg">
              <div className="flex items-center gap-2 px-4 w-full justify-between">
                {/* Left: Breadcrumb */}
                <div className="flex items-center gap-2">
                  <LeftSidebarTrigger className="-ml-1" />
                  <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-4"
                  />
                  <Breadcrumb>
                    <BreadcrumbList>
                      {crumbSegments.map((seg, i) => (
                        <React.Fragment key={seg}>
                          {i > 0 && <BreadcrumbSeparator />}
                          {i < crumbSegments.length - 1 ? (
                            <BreadcrumbItem>
                              <BreadcrumbLink
                                href={
                                  "/" + crumbSegments.slice(0, i + 1).join("/")
                                }
                              >
                                {segmentNameMap[seg] || seg}
                              </BreadcrumbLink>
                            </BreadcrumbItem>
                          ) : (
                            <BreadcrumbItem>
                              <BreadcrumbPage>
                                {segmentNameMap[seg] || seg}
                              </BreadcrumbPage>
                            </BreadcrumbItem>
                          )}
                        </React.Fragment>
                      ))}
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
                {/* Right: Icons */}
                <div className="flex items-center gap-3">
                  {/* Search Bar */}
                  <button
                    type="button"
                    className="flex items-center bg-muted rounded-lg border border-border px-4 py-2 w-56 cursor-pointer text-muted-foreground text-sm gap-2 relative hover:bg-muted/80 transition"
                    onClick={() => setOpen(true)}
                    aria-label="Open search"
                  >
                    <SearchIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 text-left text-muted-foreground">
                      Search
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      Ctrl K
                    </span>
                  </button>
                  <CommandDialog open={open} onOpenChange={setOpen}>
                    <CommandInput
                      placeholder="Search..."
                      value={search}
                      onValueChange={setSearch}
                    />
                    <CommandList>
                      {filteredSections.length === 0 ? (
                        <CommandEmpty>No results found.</CommandEmpty>
                      ) : (
                        <CommandGroup heading="Sections">
                          {filteredSections.map((section) => (
                            <CommandItem
                              key={section.url}
                              onSelect={() => {
                                setOpen(false);
                                setSearch("");
                                router.push(section.url);
                              }}
                            >
                              {section.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </CommandDialog>
                  {/* Theme Toggle */}
                  <button
                    className="p-2 rounded hover:bg-muted transition-colors"
                    aria-label="Toggle theme"
                    type="button"
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                  >
                    {theme === "dark" ? (
                      <Sun className="w-5 h-5" />
                    ) : (
                      <Moon className="w-5 h-5" />
                    )}
                  </button>
                  {/* Notification Icon */}
                  <button
                    className="p-2 rounded hover:bg-muted transition-colors"
                    aria-label="Notifications"
                    type="button"
                  >
                    <Bell className="w-5 h-5" />
                  </button>
                  {/* Chat/Menu Icon */}
                  <button
                    className="p-2 rounded hover:bg-muted transition-colors"
                    aria-label="Chat"
                    type="button"
                    onClick={() => setChatOpen(true)}
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  {/* Right Sidebar Trigger */}
                  <RightSidebarTrigger />
                </div>
              </div>
            </header>
            <div className="flex flex-1 min-w-0 flex-col gap-4 p-4 pt-4">
              {children}
            </div>
          </SidebarInset>
        </div>
        <SidebarRight />
      </SidebarProvider>
    </div>
  );
}
