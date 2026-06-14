"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyStudentArticlesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/community");
  }, [router]);
  return null;
}
