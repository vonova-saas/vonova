"use client";

import CommunityArticlePageClient from "@/components/community/community-article-page-client";
import { useParams } from "next/navigation";

export default function StudentCommunityArticlePage() {
  const params = useParams<{ studentId: string; slug: string }>();
  const studentId = params?.studentId ?? "";
  const slug = params?.slug ?? "";

  return <CommunityArticlePageClient area="student" userId={studentId} slug={slug} />;
}

