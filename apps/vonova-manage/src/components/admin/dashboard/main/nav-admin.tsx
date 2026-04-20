"use client";

import {
  User,
  Bell,
  ChevronsUpDown,
  Loader,
  LogOut,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import useAdminId from "@/hooks/admin/use-admin-id";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { logoutMutationFn, getCurrentUserQueryFn } from "@/services";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { getAccountMutationFn } from "@/services/app/account.api";

export function NavAdmin({
  admin,
}: {
  admin: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const isMobile = useIsMobile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const adminId = useAdminId();
  const queryClient = useQueryClient();
  const { mutateAsync: logout } = useMutation({ mutationFn: logoutMutationFn });
  const { data: me } = useQuery({ queryKey: ["authUser"], queryFn: getCurrentUserQueryFn });
  const { data: account, refetch: refetchAccount } = useQuery({
    queryKey: ["account", adminId],
    queryFn: () => getAccountMutationFn(adminId),
    enabled: !!adminId && adminId !== "undefined",
  });

  // Listen for account updates triggered by AccountFormClient and refresh data
  useEffect(() => {
    const onAccountUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      if (adminId) {
        queryClient.invalidateQueries({ queryKey: ["account", adminId] });
        refetchAccount();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('account:updated', onAccountUpdated);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('account:updated', onAccountUpdated);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  // Prefer live user data; fall back to provided props
  const userName = me?.user?.name || admin.name;
  const userEmail = me?.user?.email || admin.email;
  // Prefer auth profilePicture; fallback to account.avatarUrl; finally to provided prop
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userAvatar = me?.user?.profilePicture || (account as any)?.data?.avatarUrl || admin.avatar;
  const initials = userName
    ? userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
    : "";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // Best-effort clean up of any temporary client state
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('verifyEmail');
        sessionStorage.removeItem('resetEmail');
        sessionStorage.removeItem('resetToken');
      }
      toast.success("Logged out successfully");
      window.location.assign(`${window.location.origin}/?logout=1`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error("Logout failed", {
        description: error?.message || "An error occurred during logout",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {userAvatar ? (
                  <AvatarImage
                    src={userAvatar}
                    alt={userName}
                    onError={(e) => {
                      // Hide broken image so fallback initials are visible
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
                <AvatarFallback className="rounded-lg">{initials || "??"}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userName}</span>
                <span className="truncate text-xs">{userEmail}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={admin.avatar} alt={admin.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{admin.name}</span>
                  <span className="truncate text-xs">{admin.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  if (adminId) {
                    router.push(`/${adminId}/settings/account`)
                  }
                }}
              >
                <User />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (adminId) {
                    router.push(`/${adminId}/settings/notifications`)
                  }
                }}
              >
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              {isLoggingOut ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
