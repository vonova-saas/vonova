"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PostCard } from "@/components/community/social/post-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCommunityPost } from "@/hooks/app/community/use-social";

export default function CommunitySinglePostPage() {
  const params = useParams<{ postId: string }>();
  const router = useRouter();
  const postId = params?.postId ?? "";
  const { data, isLoading, isError } = useCommunityPost(postId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="mx-auto max-w-2xl p-10 text-center text-sm text-muted-foreground">
        <p>Post not found or it may have been removed.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => router.push("/community/explore")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Explore community
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 gap-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <PostCard post={data} />
    </div>
  );
}
