"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  Compass,
  Home,
  MessageSquare,
  Moon,
  Search,
  Shield,
  Sun,
  UsersRound,
  Flag,
} from "lucide-react";
import React from "react";

import { cn } from "@/lib/utils";
import {
  AuthProvider,
  useAuthContextOptional,
} from "@/context/app/auth/auth-context";
import { NotificationsBell } from "@/components/community/social/notifications-bell";
import { AiCreditsNavButton } from "@/components/shared/ai-credits/ai-credits-nav-button";
import { CommunitySocketProvider } from "@/providers/community-socket-provider";
import { CommunitySocketBridge } from "@/providers/community-socket-bridge";

import { AppSidebar as StudentAppSidebar } from "@/components/student/main/app-sidebar";
import { AppSidebar as InstructorAppSidebar } from "@/components/instructor/main/app-sidebar";
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
import { useTheme } from "next-themes";

const NAV = [
  { href: "/community", label: "Feed", icon: Home, match: "exact" as const },
  { href: "/community/explore", label: "Explore", icon: Compass },
  { href: "/community/articles", label: "Articles", icon: BookOpen },
  { href: "/community/messages", label: "Messages", icon: MessageSquare },
  { href: "/community/groups", label: "Groups", icon: UsersRound },
  { href: "/community/notifications", label: "Alerts", icon: Bell },
];

const BREADCRUMB_LABELS: Record<string, string> = {
  community: "Community",
  explore: "Explore",
  articles: "Articles",
  messages: "Messages",
  groups: "Groups",
  notifications: "Alerts",
  search: "Search",
  profile: "Profile",
  courses: "Courses",
  admin: "Admin",
  moderation: "Moderation",
  analytics: "Analytics",
  new: "New",
};

export default function CommunityRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <CommunitySocketProvider>
        <CommunitySocketBridge />
        <CommunityShell>{children}</CommunityShell>
      </CommunitySocketProvider>
    </AuthProvider>
  );
}

/**
 * Renders /community/* inside the same LMS sidebar shell the rest of the
 * platform uses. We pick the student or instructor sidebar based on the
 * authenticated user's role so the user keeps the navigation they're used to.
 */
function CommunityShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const auth = useAuthContextOptional();
  const role = String(auth?.user?.role ?? "").toUpperCase();
  const isInstructor = role === "INSTRUCTOR_USER" || role === "INSTRUCTOR";
  const isAdmin = role === "ADMIN";

  const nav = isAdmin
    ? [
        ...NAV,
        {
          href: "/community/admin/moderation",
          label: "AI mod",
          icon: Shield,
        },
        {
          href: "/admin/community/reports",
          label: "Reports",
          icon: Flag,
        },
      ]
    : NAV;

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Build a breadcrumb trail relative to /community (the LMS shell's
  // Dashboard link already points back to the role dashboard).
  const segments = pathname.split("/").filter(Boolean);
  const communityIdx = segments.indexOf("community");
  const crumbSegments =
    communityIdx >= 0 ? segments.slice(communityIdx) : ["community"];

  return (
    <div className="flex min-h-screen w-full">
      <SidebarProvider defaultOpen={false}>
        {isInstructor ? <InstructorAppSidebar /> : <StudentAppSidebar />}
        <div className="flex flex-1 min-w-0 flex-col">
          <SidebarInset>
            <header className="sticky top-0 z-30 flex h-17 shrink-0 items-center gap-2 border-b bg-muted/10 backdrop-blur-lg transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14">
              <div className="flex w-full items-center justify-between gap-3 px-4 md:px-5">
                <div className="flex items-center gap-2">
                  <LeftSidebarTrigger className="-ml-1" />
                  <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-4"
                  />
                  <Breadcrumb>
                    <BreadcrumbList className="flex-nowrap overflow-x-auto py-1 scrollbar-hide">
                      {crumbSegments.map((segment, index) => {
                        const href = `/${crumbSegments
                          .slice(0, index + 1)
                          .join("/")}`;
                        const displayName =
                          BREADCRUMB_LABELS[segment] ??
                          decodeURIComponent(segment);
                        const isLast = index === crumbSegments.length - 1;
                        return (
                          <React.Fragment key={`${segment}-${index}`}>
                            {index > 0 && (
                              <BreadcrumbSeparator className="mx-1" />
                            )}
                            <BreadcrumbItem className="whitespace-nowrap">
                              <BreadcrumbLink asChild>
                                <Link
                                  href={href}
                                  className={`text-sm md:text-base ${
                                    isLast
                                      ? "font-medium"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {displayName}
                                </Link>
                              </BreadcrumbLink>
                            </BreadcrumbItem>
                          </React.Fragment>
                        );
                      })}
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>

                <div className="flex items-center gap-2">
                  <form
                    className="relative hidden md:block"
                    role="search"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const data = new FormData(e.currentTarget);
                      const q = String(data.get("q") ?? "").trim();
                      if (q) {
                        router.push(
                          `/community/search?q=${encodeURIComponent(q)}`,
                        );
                      }
                    }}
                  >
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground md:h-5 md:w-5" />
                    <input
                      name="q"
                      type="search"
                      placeholder="Search community…"
                      className="h-10 w-56 rounded-xl border border-border bg-muted pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-violet-400/30 md:h-11 md:w-72 md:pl-11 md:text-base lg:w-80"
                    />
                  </form>
                  <NotificationsBell />
                  <AiCreditsNavButton />
                  {mounted ? (
                    <button
                      className="rounded-lg p-2.5 transition-colors hover:bg-muted md:p-3"
                      aria-label="Toggle theme"
                      type="button"
                      onClick={() =>
                        setTheme(theme === "dark" ? "light" : "dark")
                      }
                    >
                      {theme === "dark" ? (
                        <Sun className="h-5 w-5 md:h-6 md:w-6" />
                      ) : (
                        <Moon className="h-5 w-5 md:h-6 md:w-6" />
                      )}
                    </button>
                  ) : (
                    <div
                      className="h-10 w-10 rounded-xl bg-muted/80 md:h-11 md:w-11"
                      aria-hidden
                    />
                  )}
                </div>
              </div>
            </header>

            <div className="flex flex-1 min-w-0 flex-col gap-5 p-4 pt-4 md:gap-6 md:p-6">
              {/* Community sub-nav — quick switching between feed, articles, etc. */}
              <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto pb-1 md:gap-2">
                {nav.map((item) => {
                  const active =
                    item.match === "exact"
                      ? pathname === item.href
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-xs font-medium transition md:h-11 md:px-5 md:text-sm",
                        active
                          ? "bg-violet-600 text-white shadow-md shadow-violet-900/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/70",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 md:h-5 md:w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mx-auto w-full max-w-7xl flex-1">{children}</div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
