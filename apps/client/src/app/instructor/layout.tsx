"use client";

import Link from "next/link";
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
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { SearchIcon } from "lucide-react";
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
import { useUserId } from "@/hooks";
import { AuthProvider } from "@/context/app/auth/auth-context";

interface Props {
  children: React.ReactNode;
}

const segmentNameMap = {
  instructor: {
    dashboard: "Instructor Dashboard",
    "courses-management": "Courses Management",
    "material-library-management": "Material Library Management",
    "quiz-managment": "Quiz Management",
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
  const userId = useUserId();
  const segments = pathname.split('/').filter(Boolean);
  // Find the index of the 'instructor' segment in the URL path
  const instructorIndex = segments.indexOf(`${userId}`);

  // Get all segments after instructor ID for breadcrumbs
  const crumbSegments = instructorIndex >= 0 && userId
    ? segments.slice(instructorIndex + 1) // +1 to skip instructorId
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

  // Dashboard sections for search (use /instructor prefix for client-side routes)
  const instructorDashboardSections = [
    { name: "Dashboard", url: userId ? `/instructor/${userId}` : "/instructor" },
    { name: "Courses Management", url: `/instructor/${userId}/courses-management` },
    { name: "Material Library Management", url: `/instructor/${userId}/material-library-management` },
    { name: "Quiz Management", url: `/instructor/${userId}/quiz-management` },
    { name: "Problem Solving Management", url: `/instructor/${userId}/problem-solving-management` },
    { name: "Presentation Builder", url: `/instructor/${userId}/presentation-builder` },
    { name: "Course Recorder", url: `/instructor/${userId}/course-recorder` },
    { name: "Community", url: `/instructor/${userId}/community` },
    { name: "Support", url: `/instructor/${userId}/support` },
    { name: "Feedback", url: `/instructor/${userId}/feedback` },
    { name: "Settings", url: `/instructor/${userId}/settings` },
    { name: "Account", url: `/instructor/${userId}/account` },
    { name: "Billing", url: `/instructor/${userId}/billing` },
    { name: "Notifications", url: `/instructor/${userId}/notifications` },
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
    <AuthProvider>
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
                        {/* user root link - always visible (Link for client-side nav) */}
                        <BreadcrumbItem className="whitespace-nowrap">
                          <BreadcrumbLink asChild>
                            <Link
                              href={userId ? `/instructor/${userId}` : "/instructor"}
                              className="text-sm md:text-base"
                            >
                              Dashboard
                            </Link>
                          </BreadcrumbLink>
                        </BreadcrumbItem>

                        {/* Dynamic breadcrumb segments */}
                        {crumbSegments.map((segment, index) => {
                          const href = userId
                            ? `/instructor/${userId}/${crumbSegments.slice(0, index + 1).join("/")}`
                            : `/instructor/${crumbSegments.slice(0, index + 1).join("/")}`;
                          const displayName = currentSegmentMap[segment as keyof typeof currentSegmentMap] || segment;
                          const isLast = index === crumbSegments.length - 1;
                          // Avoid SSR/client branch on `window` — only narrow crumbs after mount (matches server first paint).
                          const isMobile =
                            mounted &&
                            typeof window !== "undefined" &&
                            window.innerWidth < 768;

                          if (isMobile && !isLast && crumbSegments.length > 1) {
                            return null;
                          }

                          return (
                            <React.Fragment key={segment}>
                              <BreadcrumbSeparator className="mx-1" />
                              <BreadcrumbItem className="whitespace-nowrap">
                                <BreadcrumbLink asChild>
                                  <Link
                                    href={href}
                                    className={`text-sm md:text-base ${isLast ? "font-medium" : "text-muted-foreground"}`}
                                  >
                                    {isMobile && crumbSegments.length > 1 && isLast ? "..." : displayName}
                                  </Link>
                                </BreadcrumbLink>
                              </BreadcrumbItem>
                            </React.Fragment>
                          );
                        })}
                      </BreadcrumbList>
                    </Breadcrumb>
                  </div>
                  {/* Right: defer interactive buttons until after mount (stable SSR HTML; avoids extension `fdprocessedid` hydration mismatches). */}
                  <div className="flex items-center gap-3">
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
                    {!mounted ? (
                      <div className="flex items-center gap-3" aria-hidden>
                        <div className="h-9 w-56 rounded-lg bg-muted/80" />
                        <div className="h-9 w-9 rounded-lg bg-muted/80" />
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
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
    </AuthProvider>
  );
}
