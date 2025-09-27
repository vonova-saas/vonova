"use client";

import React from "react";
import useAuthorization, { RoleType } from "@/hooks/app/auth/use-authorization";
import { useRouter } from "next/navigation";

export type WithAuthOptions = {
  requiredRoles?: RoleType[];
  redirectTo?: string; // default: /auth/signin
  fallback?: React.ReactNode; // optional UI instead of redirect
};

export default function withAuth<P extends object>(
  Wrapped: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const {
    requiredRoles = [],
    redirectTo = "/auth/login",
    fallback,
  } = options;

  const Guard: React.FC<P> = (props: P) => {
    const router = useRouter();
    const {
      isAuthenticated,
      isRole,
    } = useAuthorization();

    // If not authenticated
    if (!isAuthenticated) {
      if (fallback) return <>{fallback}</>;
      if (typeof window !== "undefined") router.push(redirectTo);
      return null;
    }

    // Roles guard (if provided)
    if (requiredRoles.length > 0 && !isRole(requiredRoles)) {
      if (fallback) return <>{fallback}</>;
      if (typeof window !== "undefined") router.push(redirectTo);
      return null;
    }

    return React.createElement(Wrapped, { ...(props as P) });
  };

  Guard.displayName = `withAuth(${Wrapped.displayName || Wrapped.name || "Component"})`;
  return Guard;
}
