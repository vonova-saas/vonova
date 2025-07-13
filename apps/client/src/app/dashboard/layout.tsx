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
    section.name.toLowerCase().includes(search.toLowerCase())
  );

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S
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
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
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
                              href={"/" + crumbSegments.slice(0, i + 1).join("/")}
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
                <div
                  className="flex items-center bg-muted/80 rounded-full px-3 py-1.5 w-56 cursor-pointer"
                  onClick={() => setOpen(true)}
                >
                  <SearchIcon className="w-4 h-4 text-muted-foreground mr-2" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="bg-transparent outline-none border-none text-sm text-foreground placeholder:text-muted-foreground flex-1"
                    onFocus={() => setOpen(true)}
                    readOnly
                  />
                </div>
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
          <div className="flex flex-1 min-w-0 flex-col gap-4 p-4 pt-0">{children}</div>
        </SidebarInset>
      </div>
      <SidebarRight />
    </SidebarProvider>
    {/* <div className="flex-shrink-0 min-w-0"> */}
    {/* </div> */}
  </div>
);
}
