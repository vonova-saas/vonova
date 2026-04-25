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

// Export the API instance for use in enhanced comments API
export const communityApi = API;

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

function normalizeComment(raw: unknown): CommunityComment {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    ...(row as CommunityComment),
    text: String(row.text ?? row.content ?? ""),
    image:
      typeof row.image === "string"
        ? row.image
        : typeof row.imageUrl === "string"
          ? row.imageUrl
          : typeof row.fileUrl === "string"
            ? row.fileUrl
            : null,
  };
}

function normalizeArticle(raw: unknown): CommunityArticle {
  const row = (raw ?? {}) as Record<string, unknown>;
  const rawImages =
    Array.isArray(row.images)
      ? row.images
      : Array.isArray(row.imageUrls)
        ? row.imageUrls
        : Array.isArray(row.files)
          ? row.files
          : [];
  const images = rawImages
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
  const coverImage =
    typeof row.coverImage === "string"
      ? row.coverImage.trim()
      : typeof row.cover_image === "string"
        ? row.cover_image.trim()
        : typeof row.imageUrl === "string"
          ? row.imageUrl.trim()
          : typeof row.thumbnail === "string"
            ? row.thumbnail.trim()
            : typeof row.thumbnailUrl === "string"
              ? row.thumbnailUrl.trim()
              : images[0];

  return {
    ...(row as CommunityArticle),
    coverImage: coverImage || undefined,
    images,
    publishedStatus:
      (typeof row.publishedStatus === "string"
        ? row.publishedStatus
        : typeof row.status === "string"
          ? row.status
          : "draft") as PublishedStatus,
  };
}

function normalizePost(raw: unknown): CommunityPost {
  const row = (raw ?? {}) as Record<string, unknown>;
  const originalCandidate =
    row.originalPost ??
    row.sharedPost ??
    row.original_post ??
    row.repost ??
    null;
  const shared =
    originalCandidate && typeof originalCandidate === "object"
      ? normalizePost(originalCandidate)
      : null;
  const images = Array.isArray(row.images)
    ? row.images.map((value) => String(value ?? "").trim()).filter(Boolean)
    : typeof row.image === "string" && row.image.trim()
      ? [row.image.trim()]
      : [];
  const videos = Array.isArray(row.videos)
    ? row.videos.map((value) => String(value ?? "").trim()).filter(Boolean)
    : typeof row.video === "string" && row.video.trim()
      ? [row.video.trim()]
      : [];
  return {
    ...(row as CommunityPost),
    originalPost: shared,
    sharedPost: shared,
    type: shared ? "repost" : "post",
    content: String(row.content ?? row.shareComment ?? ""),
    image: images[0] ?? null,
    images,
    video: videos[0] ?? null,
    videos,
  };
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
    data: (body.data ?? []).map(normalizeArticle),
    pagination: body.pagination ?? emptyPagination(),
  };
}

export async function fetchArticleById(id: string): Promise<CommunityArticle> {
  const res = await API.get(`${ARTICLES}/${id}`);
  const inner = unwrapData<{ data?: CommunityArticle } | CommunityArticle>(res.data);
  if (inner && typeof inner === "object" && "data" in inner && inner.data) {
    return normalizeArticle(inner.data);
  }
  return normalizeArticle(inner);
}

export async function fetchArticleBySlug(slug: string): Promise<CommunityArticle> {
  const res = await API.get(`${ARTICLES}/slug/${encodeURIComponent(slug)}`);
  const inner = unwrapData<{ data?: CommunityArticle } | CommunityArticle>(res.data);
  if (inner && typeof inner === "object" && "data" in inner && inner.data) {
    return normalizeArticle(inner.data);
  }
  return normalizeArticle(inner);
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

export type GenerateArticleWithAIResponse = {
  title: string;
  summary: string;
  body: string;
  category:
  | "architecture"
  | "devops"
  | "backend"
  | "databases"
  | "frontend"
  | "mobile"
  | "ai"
  | "security";
};

const ARTICLE_CATEGORY_KEYWORDS: Array<{
  category: GenerateArticleWithAIResponse["category"];
  terms: string[];
}> = [
    { category: "frontend", terms: ["frontend", "front-end", "css", "html", "react", "vue", "angular"] },
    { category: "backend", terms: ["backend", "back-end", "api", "server", "node", "express"] },
    { category: "databases", terms: ["database", "sql", "nosql", "mongodb", "postgres"] },
    { category: "devops", terms: ["devops", "docker", "kubernetes", "ci/cd", "deployment"] },
    { category: "mobile", terms: ["mobile", "android", "ios", "react native", "flutter"] },
    { category: "ai", terms: ["ai", "machine learning", "llm", "neural", "artificial intelligence"] },
    { category: "security", terms: ["security", "auth", "encryption", "vulnerability", "owasp"] },
    { category: "architecture", terms: ["architecture", "system design", "microservices", "scalability"] },
  ];

function cleanGeneratedMarkdown(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  return trimmed
    .replace(/^```[a-zA-Z]*\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();
}

function inferCategoryFromText(input: string): GenerateArticleWithAIResponse["category"] {
  const text = input.toLowerCase();
  for (const entry of ARTICLE_CATEGORY_KEYWORDS) {
    if (entry.terms.some((term) => text.includes(term))) {
      return entry.category;
    }
  }
  return "backend";
}

function parseMarkdownArticle(rawMarkdown: string): GenerateArticleWithAIResponse {
  const markdown = cleanGeneratedMarkdown(rawMarkdown);
  const lines = markdown.split(/\r?\n/).map((line) => line.trim());

  const headingLine = lines.find((line) => /^#\s+/.test(line)) ?? "";
  const title = headingLine.replace(/^#\s+/, "").trim();

  const summaryLine = lines.find(
    (line) =>
      line.length > 40 &&
      !line.startsWith("#") &&
      !line.startsWith("```") &&
      !line.startsWith("- ") &&
      !line.startsWith("* "),
  );
  const summary = summaryLine?.replace(/\s+/g, " ").trim() ?? "";

  return {
    title,
    summary,
    body: markdown,
    category: inferCategoryFromText(markdown),
  };
}

function normalizeGeneratedArticlePayload(raw: unknown): GenerateArticleWithAIResponse {
  const root = (raw ?? {}) as Record<string, unknown>;
  const nested = (
    (root.data as Record<string, unknown> | undefined) ??
    (typeof root.article === "object" && root.article
      ? (root.article as Record<string, unknown>)
      : undefined) ??
    root
  ) as Record<string, unknown>;

  if (typeof root.article === "string") {
    return parseMarkdownArticle(root.article);
  }

  if (typeof nested.article === "string") {
    return parseMarkdownArticle(nested.article);
  }

  const title = String(nested.title ?? nested.headline ?? "");
  const summary = String(nested.summary ?? nested.description ?? nested.excerpt ?? "");
  const body = String(nested.body ?? nested.content ?? nested.articleBody ?? nested.markdown ?? "");
  const categoryRaw = nested.category;
  const category =
    typeof categoryRaw === "string"
      ? categoryRaw
      : Array.isArray(categoryRaw)
        ? String(categoryRaw[0] ?? "")
        : inferCategoryFromText(`${title}\n${summary}\n${body}`);

  return {
    title,
    summary,
    body,
    category: category as GenerateArticleWithAIResponse["category"],
  };
}

export async function generateArticleWithAIMutationFn(
  topic: string,
): Promise<GenerateArticleWithAIResponse> {
  const base = process.env.NEXT_PUBLIC_AI_ARTICLE_GENERATION_API_BASE?.trim();
  if (!base) {
    throw new Error("NEXT_PUBLIC_AI_ARTICLE_GENERATION_API_BASE is not configured");
  }
  const url = `${base.replace(/\/+$/, "")}/generate_article`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
  });
  const payload = (await res.json()) as
    | GenerateArticleWithAIResponse
    | { data?: GenerateArticleWithAIResponse; message?: string };
  if (!res.ok) {
    const message = (payload as { message?: string })?.message || "Failed to generate article";
    throw new Error(message);
  }
  const normalized = normalizeGeneratedArticlePayload(payload);
  return normalized;
}

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
  const res = await API.post(ARTICLES, form);
  const inner = unwrapData<{ data?: CommunityArticle } | CommunityArticle>(res.data);
  if (inner && typeof inner === "object" && "data" in inner && inner.data) {
    return normalizeArticle(inner.data);
  }
  return normalizeArticle(inner);
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
  const res = await API.put(`${ARTICLES}/${id}`, form);
  const inner = unwrapData<{ data?: CommunityArticle } | CommunityArticle>(res.data);
  if (inner && typeof inner === "object" && "data" in inner && inner.data) {
    return normalizeArticle(inner.data);
  }
  return normalizeArticle(inner);
}

/** PUT /api/v1/community/articles/{id} */
export async function putCommunityArticleById(
  id: string,
  input: Omit<UpdateArticleInput, "id">,
): Promise<CommunityArticle> {
  return updateArticle({ id, ...input });
}

export async function deleteArticle(id: string): Promise<void> {
  await API.delete(`${ARTICLES}/${id}`);
}

export async function approveArticle(id: string): Promise<CommunityArticle> {
  const res = await API.put(`${ARTICLES}/${id}/approve`);
  const inner = unwrapData<{ data?: CommunityArticle } | CommunityArticle>(res.data);
  if (inner && typeof inner === "object" && "data" in inner && inner.data) {
    return normalizeArticle(inner.data);
  }
  return normalizeArticle(inner);
}

/** PUT /api/v1/community/articles/{id}/approve */
export async function putCommunityArticleApproveById(id: string): Promise<CommunityArticle> {
  return approveArticle(id);
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export async function fetchPosts(page = 1, limit = 10): Promise<PostsListPayload> {
  const res = await API.get(POSTS, { params: { page, limit } });
  const body = res.data as { message?: string; data?: PostsListPayload };
  if (body.data) {
    return {
      ...body.data,
      posts: (body.data.posts ?? []).map(normalizePost),
    };
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
    return {
      ...body.data,
      posts: (body.data.posts ?? []).map(normalizePost),
    };
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
    return normalizePost(inner.post);
  }
  if (inner && typeof inner === "object" && "data" in inner && inner.data?.post) {
    return normalizePost(inner.data.post);
  }
  return normalizePost(inner);
}

export type CreatePostInput = {
  content: string;
  tags?: string[];
  files?: File[];
  videos?: File[];
};

export async function createPost(input: string | CreatePostInput, image?: File): Promise<CommunityPost> {
  const normalized: CreatePostInput =
    typeof input === "string"
      ? {
        content: input,
        files: image ? [image] : undefined,
      }
      : input;

  const hasBinary = Boolean((normalized.files?.length ?? 0) > 0 || (normalized.videos?.length ?? 0) > 0);
  const payload = hasBinary
    ? (() => {
      const form = new FormData();
      form.append("content", normalized.content);
      for (const tag of normalized.tags ?? []) form.append("tags", tag);
      for (const file of normalized.files ?? []) form.append("files", file);
      for (const video of normalized.videos ?? []) form.append("videos", video);
      return form;
    })()
    : {
      content: normalized.content,
      ...(normalized.tags?.length ? { tags: normalized.tags } : {}),
    };
  const res = await API.post(POSTS, payload);
  const inner = unwrapData<{ data?: { post?: CommunityPost }; post?: CommunityPost }>(
    res.data,
  );
  if (inner && typeof inner === "object" && "post" in inner && inner.post) {
    return normalizePost(inner.post);
  }
  if (inner && typeof inner === "object" && "data" in inner && inner.data?.post) {
    return normalizePost(inner.data.post);
  }
  return normalizePost(inner);
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
    return normalizePost(inner.post);
  }
  if (inner && typeof inner === "object" && "data" in inner && inner.data?.post) {
    return normalizePost(inner.data.post);
  }
  return normalizePost(inner);
}

/** PUT /api/v1/community/posts/{postId} */
export async function putCommunityPostById(
  postId: string,
  payload: { content?: string; image?: File | null },
): Promise<CommunityPost> {
  return updatePost(postId, payload);
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

export async function sharePost(
  postId: string,
  shareComment?: string,
): Promise<{ shareableLink: string; sharesCount: number; sharedPost?: CommunityPost }> {
  const normalizeShareableLink = (raw: unknown): string => {
    const value = String(raw ?? "").trim();
    if (!value) return "";
    const candidates = value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (candidates.length === 0) return "";
    const postsPathCandidate = candidates.find((url) => /\/posts\/[a-zA-Z0-9]+/i.test(url));
    if (postsPathCandidate) return postsPathCandidate;
    const absoluteCandidate = candidates.find((url) => /^https?:\/\//i.test(url));
    if (absoluteCandidate) return absoluteCandidate;
    return candidates[0];
  };

  // Backend currently requires generated shared posts to have non-empty content.
  // Send a default share comment so share creation never fails validation.
  const res = await API.post(`${POSTS}/${postId}/share`, {
    comment: shareComment?.trim() || "Shared a post",
  });
  const body = res.data as {
    data?: {
      shareableLink?: string;
      originalPostSharesCount?: number;
      sharedPost?: CommunityPost;
    };
    shareableLink?: string;
    originalPostSharesCount?: number;
    sharedPost?: CommunityPost;
  };
  const d = body.data ?? body;
  return {
    shareableLink: normalizeShareableLink(d?.shareableLink),
    sharesCount: Number(d?.originalPostSharesCount ?? 0),
    sharedPost: d?.sharedPost ? normalizePost(d.sharedPost) : undefined,
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
    return { comments: inner.comments.map(normalizeComment) };
  }
  if (inner && typeof inner === "object" && "data" in inner) {
    const d = inner.data as { comments?: CommunityComment[] } | CommunityComment[];
    if (Array.isArray(d)) {
      return { comments: d.map(normalizeComment) };
    }
    if (d && typeof d === "object" && "comments" in d && Array.isArray(d.comments)) {
      return { comments: d.comments.map(normalizeComment) };
    }
  }
  return { comments: [] };
}

export async function createComment(postId: string, text: string, image?: File): Promise<CommunityComment> {
  const endpoint = `${POSTS}/${postId}/comments`;
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Comment text is required");
  }

  const parse = (raw: unknown): CommunityComment => {
    const inner = unwrapData<{ data?: CommunityComment } | CommunityComment>(raw as never);
    if (inner && typeof inner === "object" && "data" in inner && inner.data) {
      return normalizeComment(inner.data);
    }
    return normalizeComment(inner);
  };

  // Send both `text` and `content` in one request for gateway compatibility.
  const form = new FormData();
  form.append("text", trimmed);
  form.append("content", trimmed);
  if (image) {
    // Community comment endpoint uses FileInterceptor("file").
    form.append("file", image);
  }
  const res = await API.post(endpoint, form);
  return parse(res.data);
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
      return normalizeComment(inner.data);
    }
    return normalizeComment(inner);
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
    form.append("file", image);
  }
  const res = await API.put(endpoint, form);
  return parse(res.data);
}

/** PUT /api/v1/community/posts/comments/{commentId} */
export async function putCommunityPostCommentById(
  commentId: string,
  text: string,
  image?: File,
): Promise<CommunityComment> {
  return updateComment(commentId, text, image);
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

// Reply to a comment
export async function createReply(
  postId: string,
  parentCommentId: string,
  text: string,
  image?: File,
): Promise<CommunityComment> {
  const endpoint = `${POSTS}/${postId}/comments/${parentCommentId}/reply`;
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Reply text is required");
  }

  const parse = (raw: unknown): CommunityComment => {
    const inner = unwrapData<{ data?: CommunityComment } | CommunityComment>(raw as never);
    if (inner && typeof inner === "object" && "data" in inner && inner.data) {
      return normalizeComment(inner.data);
    }
    return normalizeComment(inner);
  };

  // Send both `text` and `content` in one request for gateway compatibility.
  const form = new FormData();
  form.append("text", trimmed);
  form.append("content", trimmed);
  if (image) {
    // Community comment endpoint uses FileInterceptor("file").
    form.append("file", image);
  }
  const res = await API.post(endpoint, form);
  return parse(res.data);
}

// Get replies for a comment
export async function getReplies(
  commentId: string,
  page = 1,
  limit = 5,
): Promise<{ replies: CommunityComment[]; total?: number; totalPages?: number }> {
  const res = await API.get(`${POSTS}/comments/${commentId}/replies`, { params: { page, limit } });
  const inner = unwrapData<
    | { replies?: CommunityComment[]; data?: { replies?: CommunityComment[] } }
    | { data?: CommunityComment[] }
  >(res.data);
  if (inner && typeof inner === "object" && "replies" in inner && inner.replies) {
    return { replies: inner.replies.map(normalizeComment) };
  }
  if (inner && typeof inner === "object" && "data" in inner) {
    const d = inner.data as { replies?: CommunityComment[] } | CommunityComment[];
    if (Array.isArray(d)) {
      return { replies: d.map(normalizeComment) };
    }
    if (d && typeof d === "object" && "replies" in d && Array.isArray(d.replies)) {
      return { replies: d.replies.map(normalizeComment) };
    }
  }
  return { replies: [] };
}
