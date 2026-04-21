"use client";

import CommunityPageClient from "@/components/community/community-page-client";
import { useParams } from "next/navigation";

export default function CommunityPage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params?.studentId ?? "";

  return <CommunityPageClient area="student" userId={studentId} />;
}
