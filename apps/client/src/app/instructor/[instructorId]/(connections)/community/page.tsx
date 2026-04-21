"use client";

import CommunityPageClient from "@/components/community/community-page-client";
import { useParams } from "next/navigation";

export default function CommunityPage() {
  const params = useParams<{ instructorId: string }>();
  const instructorId = params?.instructorId ?? "";

  return <CommunityPageClient area="instructor" userId={instructorId} />;
}
