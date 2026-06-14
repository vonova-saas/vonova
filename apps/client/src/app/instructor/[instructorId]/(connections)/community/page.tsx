"use client";

/**
 * Legacy `/instructor/:instructorId/community` route — superseded by the
 * role-agnostic `/community` realtime hub. Redirects so legacy sidebar and
 * bookmarked links still land in the new UI.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyInstructorCommunityRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/community");
  }, [router]);
  return null;
}
