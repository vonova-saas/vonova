import API from "@/services/axios-client";
import type {
  ArticlesListResponse,
  CommunityArticle,
  CommunityArticleCategory,
  CommunityComment,
  CommunityPost,
  PostsListPayload,
  PublishedStatus,
} from "@/types/api/app/community/community.types";

const ARTICLES = "/community/articles";
const POSTS = "/community/posts";

export type QueryArticlesParams = {
  page?: number;
  limit?: number;
  category?: string | string[];
  author?: string;
  /** Gateway query param per community API doc (`status`, not `publishedStatus`). */
  status?: PublishedStatus;
};

function unwrapData<T>(res: { data?: T } | T): T {
  if (res && typeof res === "object" && "data" in res && res.data !== undefined) {
    return res.data as T;
  }
  return res as T;
}

const emptyPagination = (): ArticlesListResponse["pagination"] => ({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
});

// ─── Articles ───────────────────────────────────────────────────────────────

export async function fetchArticles(
  params?: QueryArticlesParams,
): Promise<ArticlesListResponse> {
  const res = await API.get(ARTICLES, { params });
  const body = res.data as ArticlesListResponse & { message?: string };
  return {
    data: body.data ?? [],
    pagination: body.pagination ?? emptyPagination(),
  };
}

export async function fetchArticleById(id: string): Promise<CommunityArticle> {
  const res = await API.get(`${ARTICLES}/${id}`);
  const inner = unwrapData<{ data?: CommunityArticle } | CommunityArticle>(res.data);
  if (inner && typeof inner === "object" && "data" in inner && inner.data) {
    return inner.data;
  }
  return inner as CommunityArticle;
}

export async function fetchArticleBySlug(slug: string): Promise<CommunityArticle> {
  const res = await API.get(`${ARTICLES}/slug/${encodeURIComponent(slug)}`);
  const inner = unwrapData<{ data?: CommunityArticle } | CommunityArticle>(res.data);
  if (inner && typeof inner === "object" && "data" in inner && inner.data) {
    return inner.data;
  }
  return inner as CommunityArticle;
}

export type CreateArticleInput = {
  title: string;
  description: string;
  contentBlocks: unknown[];
  category: CommunityArticleCategory[];
  seoMetadata?: Record<string, unknown>;
  /** If omitted, a unique slug is generated from the title (avoids Mongo duplicate slug errors). */
  slug?: string;
  coverFiles?: File[];
};

/** Matches backend article slug rules: lowercase letters, digits, hyphens. */
export function slugifyArticleTitle(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
  return base || "article";
}

export function makeUniqueArticleSlug(title: string): string {
  const base = slugifyArticleTitle(title);
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${base}-${suffix}`;
}

export async function createArticle(input: CreateArticleInput): Promise<CommunityArticle> {
  const form = new FormData();
  form.append("title", input.title);
  form.append("description", input.description);
  form.append("contentBlocks", JSON.stringify(input.contentBlocks));
  form.append("category", JSON.stringify(input.category));
  if (input.seoMetadata) {
    form.append("seoMetadata", JSON.stringify(input.seoMetadata));
  }
  const slug = input.slug?.trim() || makeUniqueArticleSlug(input.title);
  form.append("slug", slug);
  const coverFiles = input.coverFiles ?? [];
  for (const file of coverFiles) {
    form.append("files", file);
  }
  // Compatibility: some gateway handlers use FileInterceptor("file"),
  // while others use FilesInterceptor("files").
  if (coverFiles[0]) {
    form.append("file", coverFiles[0]);
  }
  const res = await API.post(ARTICLES, form);
  const inner = unwrapData<{ data?: CommunityArticle } | CommunityArticle>(res.data);
  if (inner && typeof inner === "object" && "data" in inner && inner.data) {
    return inner.data;
  }
  return inner as CommunityArticle;
}

export type UpdateArticleInput = Partial<CreateArticleInput> & { id: string };

export async function updateArticle(input: UpdateArticleInput): Promise<CommunityArticle> {
  const { id, coverFiles, ...rest } = input;
  const form = new FormData();
  if (rest.title !== undefined) form.append("title", rest.title);
  if (rest.description !== undefined) form.append("description", rest.description);
  if (rest.contentBlocks !== undefined) {
    form.append("contentBlocks", JSON.stringify(rest.contentBlocks));
  }
  if (rest.category !== undefined) {
    form.append("category", JSON.stringify(rest.category));
  }
  if (rest.seoMetadata !== undefined) {
    form.append("seoMetadata", JSON.stringify(rest.seoMetadata));
  }
  if (rest.slug !== undefined) form.append("slug", rest.slug);
  const nextCoverFiles = coverFiles ?? [];
  for (const file of nextCoverFiles) {
    form.append("files", file);
  }
  if (nextCoverFiles[0]) {
    form.append("file", nextCoverFiles[0]);
  }
  const res = await API.put(`${ARTICLES}/${id}`, form);
  const inner = unwrapData<{ data?: CommunityArticle } | CommunityArticle>(res.data);
  if (inner && typeof inner === "object" && "data" in inner && inner.data) {
    return inner.data;
  }
  return inner as CommunityArticle;
}

export async function deleteArticle(id: string): Promise<void> {
  await API.delete(`${ARTICLES}/${id}`);
}

export async function approveArticle(id: string): Promise<CommunityArticle> {
  const res = await API.put(`${ARTICLES}/${id}/approve`);
  const inner = unwrapData<{ data?: CommunityArticle } | CommunityArticle>(res.data);
  if (inner && typeof inner === "object" && "data" in inner && inner.data) {
    return inner.data;
  }
  return inner as CommunityArticle;
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export async function fetchPosts(page = 1, limit = 10): Promise<PostsListPayload> {
  const res = await API.get(POSTS, { params: { page, limit } });
  const body = res.data as { message?: string; data?: PostsListPayload };
  if (body.data) {
    return body.data;
  }
  return {
    posts: [],
    total: 0,
    page,
    limit,
    totalPages: 0,
  };
}

export async function fetchPostsByUser(
  userId: string,
  page = 1,
  limit = 10,
): Promise<PostsListPayload> {
  const res = await API.get(`${POSTS}/user/${userId}`, { params: { page, limit } });
  const body = res.data as { message?: string; data?: PostsListPayload };
  if (body.data) {
    return body.data;
  }
  return {
    posts: [],
    total: 0,
    page,
    limit,
    totalPages: 0,
  };
}

export async function fetchPostById(postId: string): Promise<CommunityPost> {
  const res = await API.get(`${POSTS}/${postId}`);
  const inner = unwrapData<{ data?: { post?: CommunityPost }; post?: CommunityPost }>(
    res.data,
  );
  if (inner && typeof inner === "object" && "post" in inner && inner.post) {
    return inner.post;
  }
  if (inner && typeof inner === "object" && "data" in inner && inner.data?.post) {
    return inner.data.post;
  }
  return inner as CommunityPost;
}

export async function createPost(content: string, image?: File): Promise<CommunityPost> {
  const payload = image
    ? (() => {
        const form = new FormData();
        form.append("content", content);
        form.append("files", image);
        return form;
      })()
    : { content };
  const res = await API.post(POSTS, payload);
  const inner = unwrapData<{ data?: { post?: CommunityPost }; post?: CommunityPost }>(
    res.data,
  );
  if (inner && typeof inner === "object" && "post" in inner && inner.post) {
    return inner.post;
  }
  if (inner && typeof inner === "object" && "data" in inner && inner.data?.post) {
    return inner.data.post;
  }
  return inner as CommunityPost;
}

export async function updatePost(
  postId: string,
  payload: { content?: string; image?: File | null },
): Promise<CommunityPost> {
  const body =
    payload.image
      ? (() => {
          const form = new FormData();
          if (payload.content !== undefined) {
            form.append("content", payload.content);
          }
          form.append("files", payload.image);
          return form;
        })()
      : { content: payload.content };
  const res = await API.put(`${POSTS}/${postId}`, body);
  const inner = unwrapData<{ data?: { post?: CommunityPost }; post?: CommunityPost }>(
    res.data,
  );
  if (inner && typeof inner === "object" && "post" in inner && inner.post) {
    return inner.post;
  }
  if (inner && typeof inner === "object" && "data" in inner && inner.data?.post) {
    return inner.data.post;
  }
  return inner as CommunityPost;
}

export async function deletePost(postId: string): Promise<void> {
  await API.delete(`${POSTS}/${postId}`);
}

export async function togglePostLike(postId: string): Promise<{ liked: boolean; likesCount: number }> {
  const res = await API.post(`${POSTS}/${postId}/like`);
  const body = res.data as {
    data?: { liked?: boolean; likesCount?: number };
    liked?: boolean;
    likesCount?: number;
  };
  const d = body.data ?? { liked: body.liked, likesCount: body.likesCount };
  return {
    liked: Boolean(d?.liked),
    likesCount: Number(d?.likesCount ?? 0),
  };
}

export async function sharePost(postId: string): Promise<{ shareableLink: string; sharesCount: number }> {
  // Avoid backend share endpoint dependency on FRONTEND_ORIGIN env.
  // Generate a stable client permalink instead.
  const base =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "";
  return {
    shareableLink: `${base}#post-${postId}`,
    sharesCount: 0,
  };
}

// ─── Comments ───────────────────────────────────────────────────────────────

export async function fetchComments(
  postId: string,
  page = 1,
  limit = 20,
): Promise<{ comments: CommunityComment[]; total?: number; totalPages?: number }> {
  const res = await API.get(`${POSTS}/${postId}/comments`, { params: { page, limit } });
  const inner = unwrapData<
    | { comments?: CommunityComment[]; data?: { comments?: CommunityComment[] } }
    | { data?: CommunityComment[] }
  >(res.data);
  if (inner && typeof inner === "object" && "comments" in inner && inner.comments) {
    return { comments: inner.comments };
  }
  if (inner && typeof inner === "object" && "data" in inner) {
    const d = inner.data as { comments?: CommunityComment[] } | CommunityComment[];
    if (Array.isArray(d)) {
      return { comments: d };
    }
    if (d && typeof d === "object" && "comments" in d && Array.isArray(d.comments)) {
      return { comments: d.comments };
    }
  }
  return { comments: [] };
}

export async function createComment(postId: string, text: string, image?: File): Promise<CommunityComment> {
  const endpoint = `${POSTS}/${postId}/comments`;

  const parse = (raw: unknown): CommunityComment => {
    const inner = unwrapData<{ data?: CommunityComment } | CommunityComment>(raw as never);
    if (inner && typeof inner === "object" && "data" in inner && inner.data) {
      return inner.data as CommunityComment;
    }
    return inner as CommunityComment;
  };

  // 1) Try JSON payload with expected key
  try {
    const res = await API.post(endpoint, { text });
    return parse(res.data);
  } catch (error) {
    const message = (
      error as { response?: { data?: { message?: unknown } } }
    )?.response?.data?.message;
    const looksLikeTextValidationError =
      typeof message === "object" &&
      message !== null &&
      "property" in message &&
      (message as { property?: string }).property === "text";

    if (!looksLikeTextValidationError && !image) {
      throw error;
    }
  }

  // 2) Try alternate backend key naming (some handlers use `content`)
  try {
    const res = await API.post(endpoint, { content: text });
    return parse(res.data);
  } catch {
    if (!image) {
      // 3) As last resort for text-only comments, send multipart with both keys
      const form = new FormData();
      form.append("text", text);
      form.append("content", text);
      const res = await API.post(endpoint, form);
      return parse(res.data);
    }
    // 3) With image present, send multipart including both possible text keys
    const form = new FormData();
    form.append("text", text);
    form.append("content", text);
    form.append("files", image);
    const res = await API.post(endpoint, form);
    return parse(res.data);
  }
}

export async function updateComment(
  commentId: string,
  text: string,
  image?: File,
): Promise<CommunityComment> {
  const endpoint = `${POSTS}/comments/${commentId}`;

  const parse = (raw: unknown): CommunityComment => {
    const inner = unwrapData<{ data?: CommunityComment } | CommunityComment>(raw as never);
    if (inner && typeof inner === "object" && "data" in inner && inner.data) {
      return inner.data as CommunityComment;
    }
    return inner as CommunityComment;
  };

  try {
    const res = await API.put(endpoint, { text });
    return parse(res.data);
  } catch {
    // continue fallback chain
  }

  try {
    const res = await API.put(endpoint, { content: text });
    return parse(res.data);
  } catch {
    // continue fallback chain
  }

  const form = new FormData();
  form.append("text", text);
  form.append("content", text);
  if (image) {
    form.append("files", image);
  }
  const res = await API.put(endpoint, form);
  return parse(res.data);
}

export async function deleteComment(commentId: string): Promise<void> {
  await API.delete(`${POSTS}/comments/${commentId}`);
}

export async function toggleCommentLike(
  commentId: string,
): Promise<{ liked: boolean; likesCount?: number }> {
  const res = await API.post(`${POSTS}/comments/${commentId}/like`);
  const body = res.data as {
    data?: { liked?: boolean; likesCount?: number };
    liked?: boolean;
    likesCount?: number;
  };
  const d = body.data ?? { liked: body.liked, likesCount: body.likesCount };
  return { liked: Boolean(d?.liked), likesCount: d?.likesCount };
}
