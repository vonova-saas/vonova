import type { QueryClient } from "@tanstack/react-query";
import { socialKeys } from "@/hooks/app/community/use-social";
import type {
  CommunityFeedItem,
  CommunityFeedResponse,
} from "@/types/api/app/community/social.types";

/** Feed row media merges use `mergeCommunityFeedItemMedia` in
 * `@/lib/community/merge-presigned-media`. Like/comment patches still touch counts only. */

export type PostPatcher = (post: CommunityFeedItem) => CommunityFeedItem;

function sharedPostId(post: CommunityFeedItem): string | null {
  const s = post.sharedPost;
  if (s && typeof s === "object" && "_id" in s) {
    return String((s as CommunityFeedItem)._id);
  }
  return null;
}

/** Patch posts whose `_id` or embedded `sharedPost._id` matches a target id. */
function patchPostRow(
  post: CommunityFeedItem,
  targetIds: Set<string>,
  patch: PostPatcher,
): CommunityFeedItem {
  const id = String(post._id);
  const embeddedId = sharedPostId(post);

  if (targetIds.has(id)) {
    return patch(post);
  }

  if (embeddedId && targetIds.has(embeddedId) && post.sharedPost) {
    const inner = post.sharedPost as CommunityFeedItem;
    return {
      ...post,
      sharedPost: patch({ ...inner, _id: embeddedId }),
    };
  }

  return post;
}

function patchFeedPages(
  pages: CommunityFeedResponse[],
  targetIds: Set<string>,
  patch: PostPatcher,
): CommunityFeedResponse[] {
  return pages.map((page) => ({
    ...page,
    posts: page.posts.map((p) => patchPostRow(p, targetIds, patch)),
  }));
}

export function patchPostInAllCaches(
  qc: QueryClient,
  postIds: string | string[],
  patch: PostPatcher,
) {
  const targetIds = new Set(
    (Array.isArray(postIds) ? postIds : [postIds]).map(String),
  );
  if (targetIds.size === 0) return;

  for (const scope of ["for-you", "explore"] as const) {
    qc.setQueryData<{
      pages: CommunityFeedResponse[];
      pageParams: unknown[];
    }>(socialKeys.feed(scope), (prev) => {
      if (!prev?.pages) return prev;
      return {
        ...prev,
        pages: patchFeedPages(prev.pages, targetIds, patch),
      };
    });
  }

  qc.setQueriesData<{
    pages: { posts: CommunityFeedItem[] }[];
    pageParams: unknown[];
  }>({ queryKey: [...socialKeys.all, "user-posts"] }, (prev) => {
    if (!prev?.pages) return prev;
    return {
      ...prev,
      pages: prev.pages.map((page) => ({
        ...page,
        posts: (page.posts ?? []).map((p) =>
          patchPostRow(p, targetIds, patch),
        ),
      })),
    };
  });

  for (const id of targetIds) {
    qc.setQueryData<CommunityFeedItem>(socialKeys.communityPost(id), (prev) =>
      prev ? patch(prev) : prev,
    );
  }
}

export function removePostFromAllCaches(qc: QueryClient, postId: string) {
  const id = String(postId);

  const removeFromFeed = (resp: CommunityFeedResponse) => ({
    ...resp,
    posts: resp.posts.filter((p) => String(p._id) !== id),
    total: Math.max(0, (resp.total ?? 0) - 1),
  });

  for (const scope of ["for-you", "explore"] as const) {
    qc.setQueryData<{
      pages: CommunityFeedResponse[];
      pageParams: unknown[];
    }>(socialKeys.feed(scope), (prev) => {
      if (!prev?.pages) return prev;
      return {
        ...prev,
        pages: prev.pages.map(removeFromFeed),
      };
    });
  }

  qc.setQueriesData<{
    pages: { posts: CommunityFeedItem[] }[];
    pageParams: unknown[];
  }>({ queryKey: [...socialKeys.all, "user-posts"] }, (prev) => {
    if (!prev?.pages) return prev;
    return {
      ...prev,
      pages: prev.pages.map((page) => ({
        ...page,
        posts: (page.posts ?? []).filter((p) => String(p._id) !== id),
      })),
    };
  });

  qc.removeQueries({ queryKey: socialKeys.communityPost(id) });
}

export function invalidatePostInteractionCaches(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: socialKeys.feed("for-you") });
  qc.invalidateQueries({ queryKey: socialKeys.feed("explore") });
  qc.invalidateQueries({ queryKey: [...socialKeys.all, "user-posts"] });
}
