"use client";

import { AppSidebar } from "@/components/instructor/main/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  LeftSidebarTrigger,
  RightSidebarTrigger,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Bell, MessageSquare, SearchIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import ChatSidebar from "@/components/instructor/main/chat-sidebar";
import { SidebarRight } from "@/components/instructor/main/right-sidebar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import useInstructorId from "@/hooks/instructor/use-instructor-id";

interface Props {
  children: React.ReactNode;
}

const segmentNameMap = {
  instructor: {
    dashboard: "Instructor Dashboard",
    "courses-management": "Courses Management",
    "material-library-management": "Material Library Management",
    "problem-solving-management": "Problem Solving Management",
    "presentation-builder": "Presentation Builder",
    "course-recorder": "Course Recorder",
    community: "Community",
    settings: "Settings",
    account: "Account",
    billing: "Billing",
    notifications: "Notifications",
    support: "Support",
    feedback: "Feedback"
  },
};

export default function InstructorDashboardLayout({ children }: Props) {
  const pathname = usePathname();
  const instructorId = useInstructorId();
  const segments = pathname.split('/').filter(Boolean);
  // Find the index of the 'instructor' segment in the URL path
  const instructorIndex = segments.indexOf('instructor');

  // Get all segments after instructor ID for breadcrumbs
  const crumbSegments = instructorIndex >= 0 && instructorId
    ? segments.slice(instructorIndex + 2) // +2 to skip both 'instructor' and instructorId
    : [];

  // Get the current segment map for breadcrumb labels
  const currentSegmentMap = segmentNameMap.instructor;

  const [open, setOpen] = React.useState(false);
  const [chatOpen, setChatOpen] = React.useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Dashboard sections for search
  const instructorDashboardSections = [
    { name: "Dashboard", url: "/instructor/:instructorId" },
    { name: "Courses Management", url: "/instructor/:instructorId/courses-management" },
    { name: "Material Library Management", url: "/instructor/:instructorId/material-library-management" },
    { name: "Problem Solving Management", url: "/instructor/:instructorId/problem-solving-management" },
    { name: "Presentation Builder", url: "/instructor/:instructorId/presentation-builder" },
    { name: "Course Recorder", url: "/instructor/:instructorId/course-recorder" },
    { name: "Community", url: "/instructor/:instructorId/community" },
    { name: "Support", url: "/instructor/:instructorId/support" },
    { name: "Feedback", url: "/instructor/:instructorId/feedback" },
    { name: "Settings", url: "/instructor/:instructorId/settings" },
    { name: "Account", url: "/instructor/:instructorId/account" },
    { name: "Billing", url: "/instructor/:instructorId/billing" },
    { name: "Notifications", url: "/instructor/:instructorId/notifications" },
  ];

  const [search, setSearch] = React.useState("");
  const instructorFilteredSections = instructorDashboardSections.filter((section) =>
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
                  <BreadcrumbList className="flex-nowrap overflow-x-auto py-1 scrollbar-hide">
                  {/* user root link - always visible */}
                  <BreadcrumbItem className="whitespace-nowrap">
                    <BreadcrumbLink
                      href={instructorId ? `/instructor/${instructorId}` : '/instructor'}
                      className="text-sm md:text-base"
                    >
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>

                  {/* Dynamic breadcrumb segments */}
                  {crumbSegments.map((segment, index) => {
                    const href = `/instructor/${instructorId}/${crumbSegments.slice(0, index + 1).join('/')}`;
                    const displayName = currentSegmentMap[segment as keyof typeof currentSegmentMap] || segment;
                    const isLast = index === crumbSegments.length - 1;
                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768; // 768px is Tailwind's 'md' breakpoint

                    // On mobile, only show the last segment if there are multiple segments
                    if (isMobile && !isLast && crumbSegments.length > 1) {
                      return null;
                    }

                    return (
                      <React.Fragment key={segment}>
                        <BreadcrumbSeparator className="mx-1" />
                        <BreadcrumbItem className="whitespace-nowrap">
                          <BreadcrumbLink
                            href={href}
                            className={`text-sm md:text-base ${isLast ? 'font-medium' : 'text-muted-foreground'}`}
                          >
                            {isMobile && crumbSegments.length > 1 && isLast ? '...' : displayName}
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                      </React.Fragment>
                    );
                  })}
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
                      {instructorFilteredSections.length === 0 ? (
                        <CommandEmpty>No results found.</CommandEmpty>
                      ) : (
                        <CommandGroup heading="Sections">
                          {instructorFilteredSections.map((section) => (
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
                    {!mounted ? null : theme === "dark" ? (
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
