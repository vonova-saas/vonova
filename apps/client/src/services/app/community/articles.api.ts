import API from "@/services/axios-client";
import type { CommunityProfileSummary } from "@/types/api/app/community/social.types";

const A = "/community/articles";

type ApiEnvelope<T> = { message?: string; data: T };

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in (payload as object)) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

/** POST create can return `{ data: article }` or nested `{ data: { data: article } }`. */
function unwrapArticleCreate(payload: unknown): CommunityArticle {
  let cur: unknown = payload;
  for (let i = 0; i < 4; i++) {
    if (!cur || typeof cur !== "object") break;
    const o = cur as Record<string, unknown>;
    if (
      typeof o._id === "string" &&
      typeof o.title === "string" &&
      typeof o.slug === "string"
    ) {
      return cur as CommunityArticle;
    }
    if ("data" in o && o.data !== undefined) {
      cur = o.data;
      continue;
    }
    break;
  }
  return cur as CommunityArticle;
}

export type ArticleStatus = "draft" | "published" | "archived";

// Kept in sync with the gateway's CreateArticleDto category enum. If a new
// category is added on the server, mirror it here.
export const ARTICLE_CATEGORIES = [
  "architecture",
  "devops",
  "backend",
  "nestjs",
  "databases",
  "frontend",
  "mobile",
  "ai",
  "security",
  "typescript",
  "javascript",
  "nodejs",
  "webdev",
  "api",
  "microservices",
] as const;
export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export type ArticleContentBlockType =
  | "text"
  | "paragraph"
  | "heading"
  | "code"
  | "image"
  | "quote"
  | "link";

export interface ArticleContentBlock {
  type: ArticleContentBlockType;
  order: number;
  content?: string;
  language?: string;
  code?: string;
  filename?: string;
  url?: string;
  caption?: string;
  alt?: string;
  quoteAuthor?: string;
  quoteSource?: string;
}

export interface CommunityArticle {
  _id: string;
  title: string;
  slug: string;
  description: string;
  contentBlocks: ArticleContentBlock[];
  category: ArticleCategory[] | string[];
  coverImage?: string | null;
  images?: string[];
  author?: CommunityProfileSummary | string;
  publishedStatus?: ArticleStatus;
  status?: ArticleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ArticlesListResponse {
  // The gateway returns either an array grouped by category or a flat list,
  // depending on filters. We normalise both shapes on the client.
  articles?: CommunityArticle[];
  data?: CommunityArticle[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ListArticlesParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  /** Mongo id of the author user */
  author?: string;
  status?: ArticleStatus;
  sortBy?: "createdAt" | "updatedAt" | "title" | "views";
  sortOrder?: "asc" | "desc";
}

export async function listArticles(
  params: ListArticlesParams = {},
): Promise<ArticlesListResponse> {
  const res = await API.get(A, { params });
  const body = res.data as {
    message?: string;
    data?: unknown;
    articles?: CommunityArticle[];
    pagination?: ArticlesListResponse["pagination"];
  };
  const pagination = body.pagination;
  const raw = body.data;

  if (Array.isArray(raw)) {
    if (raw.length === 0) {
      return { articles: [], pagination };
    }
    const first = raw[0] as Record<string, unknown> | undefined;
    const grouped =
      first &&
      typeof first === "object" &&
      "articles" in first &&
      Array.isArray(first.articles);
    if (grouped) {
      const flat = (raw as Array<{ articles?: CommunityArticle[] }>).flatMap(
        (g) => g.articles ?? [],
      );
      return { articles: flat, pagination };
    }
    return { articles: raw as CommunityArticle[], pagination };
  }

  if (Array.isArray(body.articles)) {
    return { articles: body.articles, pagination };
  }

  return { articles: [], pagination };
}

export async function getArticleById(id: string): Promise<CommunityArticle> {
  const res = await API.get(`${A}/${id}`);
  return unwrap<CommunityArticle>(res.data);
}

export async function getArticleBySlug(slug: string): Promise<CommunityArticle> {
  const res = await API.get(`${A}/slug/${encodeURIComponent(slug)}`);
  return unwrap<CommunityArticle>(res.data);
}

export interface CreateArticleInput {
  title: string;
  description: string;
  contentBlocks: ArticleContentBlock[];
  category: ArticleCategory[];
  coverImage?: File | null;
  seoMetadata?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

export interface UpdateArticleInput {
  title: string;
  description: string;
  contentBlocks: ArticleContentBlock[];
  category: ArticleCategory[];
  coverImage?: File | null;
  seoMetadata?: CreateArticleInput["seoMetadata"];
}

export async function updateArticle(
  id: string,
  input: UpdateArticleInput,
): Promise<CommunityArticle> {
  const form = new FormData();
  form.append("title", input.title);
  form.append("description", input.description);
  form.append("contentBlocks", JSON.stringify(input.contentBlocks));
  form.append("category", JSON.stringify(input.category));
  if (input.seoMetadata) {
    form.append("seoMetadata", JSON.stringify(input.seoMetadata));
  }
  if (input.coverImage) form.append("files", input.coverImage);
  const res = await API.put(`${A}/${encodeURIComponent(id)}`, form);
  return unwrapArticleCreate(unwrap<unknown>(res.data));
}

export async function deleteArticle(id: string): Promise<void> {
  await API.delete(`${A}/${encodeURIComponent(id)}`);
}

export async function createArticle(
  input: CreateArticleInput,
): Promise<CommunityArticle> {
  const form = new FormData();
  form.append("title", input.title);
  form.append("description", input.description);
  form.append("contentBlocks", JSON.stringify(input.contentBlocks));
  form.append("category", JSON.stringify(input.category));
  if (input.seoMetadata) {
    form.append("seoMetadata", JSON.stringify(input.seoMetadata));
  }
  if (input.coverImage) form.append("files", input.coverImage);
  const res = await API.post(A, form);
  return unwrapArticleCreate(unwrap<unknown>(res.data));
}
