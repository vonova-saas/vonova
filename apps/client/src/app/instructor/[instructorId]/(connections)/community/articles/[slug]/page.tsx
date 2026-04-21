"use client";

import CommunityArticlePageClient from "@/components/community/community-article-page-client";
import { useParams } from "next/navigation";

export default function InstructorCommunityArticlePage() {
  const params = useParams<{ instructorId: string; slug: string }>();
  const instructorId = params?.instructorId ?? "";
  const slug = params?.slug ?? "";

  return <CommunityArticlePageClient area="instructor" userId={instructorId} slug={slug} />;
}

