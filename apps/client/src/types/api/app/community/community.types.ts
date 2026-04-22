export type CommunityArticleCategory =
  | "architecture"
  | "devops"
  | "backend"
  | "databases"
  | "frontend"
  | "mobile"
  | "ai"
  | "security";

export type PublishedStatus = "draft" | "published" | "archived";

export type ContentBlockType =
  | "paragraph"
  | "heading"
  | "code"
  | "image"
  | "quote";

export type ArticleContentBlock = {
  type: ContentBlockType;
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
};

export type CommunityAuthor = {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  profilePicture?: string;
  role?: string;
};

export type CommunityArticle = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  contentBlocks?: ArticleContentBlock[];
  category: CommunityArticleCategory[];
  publishedStatus: PublishedStatus;
  coverImage?: string;
  images?: string[];
  author?: CommunityAuthor | string;
  createdAt?: string;
  updatedAt?: string;
  wordCount?: number;
  seoMetadata?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
};

export type CommunityPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type ArticlesListResponse = {
  data: CommunityArticle[];
  pagination: CommunityPagination;
};

export type CommunityPost = {
  _id: string;
  type?: "post" | "repost";
  content: string;
  image?: string | null;
  images?: string[];
  author?: CommunityAuthor | string;
  originalPost?: CommunityPost | null;
  sharedPost?: CommunityPost | null;
  sharedBy?: CommunityAuthor | string | null;
  shareComment?: string | null;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  likes?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type PostsListPayload = {
  posts: CommunityPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CommunityComment = {
  _id: string;
  text: string;
  image?: string | null;
  author?: CommunityAuthor | string;
  likesCount?: number;
  createdAt?: string;
};
