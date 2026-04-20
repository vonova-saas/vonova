/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import useAuth from "@/hooks/auth/use-auth";
import { currentUserResponseType } from "@/types/api/auth/auth.type";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect } from "react";

// Define context shape
type AuthContextType = {
  user?: currentUserResponseType['user'];
  role?: string;
  isRole: (roles: string | string[]) => boolean;
  error: any;
  isLoading: boolean;
  isFetching: boolean;
  isAuthenticated: boolean;
  refetchAuth: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  // Fetch current user (with silent refresh)
  const {
    data: authData,
    error: authError,
    isLoading,
    isFetching,
    refetch: refetchAuth,
  } = useAuth();

  const user = authData?.user;
  const isAuthenticated = !!user?._id;
  const role = user?.role;

  // Handle authentication redirects
  useEffect(() => {
    if (authError) {
      const status = (authError as any)?.response?.status;
      if (status === 401) {
        // Unauthorized - redirect to login
        if (typeof window !== 'undefined') {
          window.location.replace(`/`);
        }
      } else if (status === 403) {
        // Forbidden - redirect to home
        if (typeof window !== 'undefined') {
          window.location.replace(`/`);
        }
      }
    }
  }, [authError, router]);

  // Get target dashboard path by role
  const getDashboardPathByRole = (role?: string) => {
    if (role === 'ADMIN') return '/admin';
  };

  // Enforce role-path isolation: if role doesn't match current path area, redirect
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isAuthenticated || !role || !user?._id) return;

    const targetPath = getDashboardPathByRole(role);

    // If user is on a path area that doesn't match their role, move them
   const isAdminRole = role === 'ADMIN';

    if (!isAdminRole) {
      router.replace(`${targetPath}/${user._id}`);
    }

  }, [isAuthenticated, role, user?._id, pathname, router]);

  const isRole = (r: string | string[]) => {
    if (!role) return false;
    return Array.isArray(r) ? r.includes(role) : role === r;
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API to clear cookies
      const { logoutMutationFn } = await import("@/services");
      await logoutMutationFn();
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.replace(`/`);
        return;
      }
    } catch (error) {
      console.error("Logout failed:", error);
      // Force redirect even if API call fails
      if (typeof window !== 'undefined') {
        window.location.replace(`/`);
        return;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isRole,
        error: authError,
        isLoading,
        isFetching,
        isAuthenticated,
        refetchAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within a AuthProvider");
  }
  return context;
};

export const useAuthContextOptional = () => {
  return useContext(AuthContext); // returns undefined if no provider
};
