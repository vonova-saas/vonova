"use client";

/**
 * Legacy `/student/:studentId/community` route — superseded by the role-agnostic
 * `/community` realtime hub. Kept as a client-side redirect so bookmarks and
 * the legacy sidebar links still land in the right place during the rollout
 * window. Safe to delete once analytics show no more traffic.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyStudentCommunityRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/community");
  }, [router]);
  return null;
}
