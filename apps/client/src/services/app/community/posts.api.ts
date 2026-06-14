import API from "@/services/axios-client";
import type {
  CommunityFeedItem,
  CommunityProfileSummary,
} from "@/types/api/app/community/social.types";

const P = "/community/posts";

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in (payload as object)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export async function togglePostLike(postId: string) {
  const res = await API.post(`${P}/${encodeURIComponent(postId)}/like`);
  return unwrap<{ liked?: boolean; likesCount?: number }>(res.data);
}

export async function sharePostRequest(postId: string, comment?: string) {
  const res = await API.post(
    `${P}/${encodeURIComponent(postId)}/share`,
    { comment: comment?.trim() || "Shared a post" },
  );
  return unwrap<{
    sharedPost?: unknown;
    originalPostSharesCount?: number;
  }>(res.data);
}

export type CommunityComment = {
  _id: string;
  text: string;
  author?: CommunityProfileSummary | Record<string, unknown>;
  image?: string | null;
  likesCount?: number;
  createdAt?: string;
  replies?: CommunityComment[];
};

export async function fetchPostComments(
  postId: string,
  page = 1,
  limit = 20,
): Promise<{
  comments: CommunityComment[];
  total: number;
  totalPages: number;
}> {
  const res = await API.get(
    `${P}/${encodeURIComponent(postId)}/comments`,
    { params: { page, limit } },
  );
  const inner = unwrap<{
    comments?: CommunityComment[];
    total?: number;
    totalPages?: number;
  }>(res.data);
  return {
    comments: inner?.comments ?? [],
    total: inner?.total ?? 0,
    totalPages: inner?.totalPages ?? 1,
  };
}

export async function createPostComment(postId: string, text: string) {
  const res = await API.post(
    `${P}/${encodeURIComponent(postId)}/comments`,
    { content: text },
  );
  return unwrap<CommunityComment>(res.data);
}

export async function toggleCommentLikeRequest(commentId: string) {
  const res = await API.post(
    `${P}/comments/${encodeURIComponent(commentId)}/like`,
  );
  return unwrap<{ liked?: boolean; likesCount?: number }>(res.data);
}

export async function fetchPostLikes(postId: string, page = 1, limit = 30) {
  const res = await API.get(
    `${P}/${encodeURIComponent(postId)}/likes`,
    { params: { page, limit } },
  );
  return unwrap<{
    items: CommunityProfileSummary[];
    total: number;
    totalPages: number;
  }>(res.data);
}

export async function fetchCommentLikes(
  commentId: string,
  page = 1,
  limit = 30,
) {
  const res = await API.get(
    `${P}/comments/${encodeURIComponent(commentId)}/likes`,
    { params: { page, limit } },
  );
  return unwrap<{
    items: CommunityProfileSummary[];
    total: number;
    totalPages: number;
  }>(res.data);
}

export async function createReplyRequest(
  postId: string,
  parentCommentId: string,
  text: string,
) {
  const res = await API.post(
    `${P}/${encodeURIComponent(postId)}/comments/${encodeURIComponent(parentCommentId)}/reply`,
    { content: text },
  );
  return unwrap<CommunityComment>(res.data);
}

export async function fetchPostsByUser(
  userId: string,
  page = 1,
  limit = 15,
): Promise<{
  posts: CommunityFeedItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const res = await API.get(
    `${P}/user/${encodeURIComponent(userId)}`,
    { params: { page, limit } },
  );
  const inner = unwrap<{
    posts?: CommunityFeedItem[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  }>(res.data);
  return {
    posts: inner.posts ?? [],
    total: inner.total ?? 0,
    page: inner.page ?? page,
    limit: inner.limit ?? limit,
    totalPages: inner.totalPages ?? 1,
  };
}

export async function fetchPostById(
  postId: string,
): Promise<CommunityFeedItem> {
  const res = await API.get(`${P}/${encodeURIComponent(postId)}`);
  const inner = unwrap<{ post: CommunityFeedItem } | CommunityFeedItem>(
    res.data,
  );
  return (inner as { post?: CommunityFeedItem }).post ?? (inner as CommunityFeedItem);
}

export async function updatePostRequest(
  postId: string,
  input: {
    content: string;
    visibility?: "PUBLIC" | "FOLLOWERS";
    images?: File[];
    videos?: File[];
  },
) {
  const form = new FormData();
  form.append("content", input.content);
  if (input.visibility) form.append("visibility", input.visibility);
  for (const file of input.images ?? []) form.append("files", file);
  for (const file of input.videos ?? []) form.append("videos", file);
  const res = await API.put(
    `${P}/${encodeURIComponent(postId)}`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return unwrap<CommunityFeedItem>(res.data);
}

export async function deletePostRequest(postId: string): Promise<{
  originalPostId?: string | null;
  originalPostSharesCount?: number | null;
  isRepost?: boolean;
}> {
  const res = await API.delete(`${P}/${encodeURIComponent(postId)}`);
  return unwrap<{
    originalPostId?: string | null;
    originalPostSharesCount?: number | null;
    isRepost?: boolean;
  }>(res.data);
}
