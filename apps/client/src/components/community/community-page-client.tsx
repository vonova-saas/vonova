"use client";



import { useAuthContext } from "@/context/app/auth/auth-context";

import {

  approveArticle,

  createArticle,

  createComment,

  createPost,

  deleteArticle,

  deleteComment,

  deletePost,

  fetchArticles,

  fetchComments,

  fetchPosts,

  fetchPostsByUser,

  generateArticleWithAIMutationFn,

  sharePost,

  toggleCommentLike,

  togglePostLike,

  updateArticle,

  updateComment,

  updatePost,

  createReply,

  getReplies,

} from "@/services/app/community/community.api";

import { getAccountMutationFn } from "@/services/app/settings/account.api";

import type {

  CommunityArticle,

  CommunityArticleCategory,

  CommunityAuthor,

  CommunityComment,

  CommunityPost,

} from "@/types/api/app/community/community.types";

import {

  useInfiniteQuery,

  useMutation,

  useQuery,

  useQueryClient,

} from "@tanstack/react-query";

import { formatDistanceToNow } from "date-fns";

import {

  BookOpen,

  ChevronLeft,

  ChevronRight,

  ImagePlus,

  Heart,

  Loader2,

  MessageCircle,

  PenLine,

  Share2,

  Sparkles,

  Users,

  Video,

} from "lucide-react";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import {

  Card,

  CardContent,

  CardDescription,

  CardFooter,

  CardHeader,

  CardTitle,

} from "@/components/ui/card";

import {

  Dialog,

  DialogContent,

  DialogFooter,

  DialogHeader,

  DialogTitle,

} from "@/components/ui/dialog";

import {

  DropdownMenu,

  DropdownMenuContent,

  DropdownMenuItem,

  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { ScrollArea } from "@/components/ui/scroll-area";

import { Skeleton } from "@/components/ui/skeleton";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Textarea } from "@/components/ui/textarea";

import { useToast } from "@/hooks";

import { articleImgSrcForDisplay } from "@/lib/article-image-display-url";
import { postImgSrcForDisplay } from "@/lib/post-image-display-url";

import { cn } from "@/lib/utils";
import { ImagePreviewGallery } from "@/components/community/image-preview-gallery";
import { ImageUploadZone } from "@/components/community/image-upload-zone";
import { LinkedInImageGalleryWithLightbox } from "@/components/community/linkedin-image-gallery-with-lightbox";
import { VideoPreviewGallery } from "@/components/community/video-preview-gallery";
import { VideoUploadZone } from "@/components/community/video-upload-zone";

import { MoreHorizontal } from "lucide-react";



const CATEGORIES: CommunityArticleCategory[] = [

  "architecture",

  "devops",

  "backend",

  "databases",

  "frontend",

  "mobile",

  "ai",

  "security",

];

const ARTICLE_DESCRIPTION_MAX_LENGTH = 500;
const POST_CONTENT_MAX_LENGTH = 2000;
const POST_MEDIA_MAX_BYTES = 700 * 1024;

function clampArticleDescription(value: string): string {
  return value.slice(0, ARTICLE_DESCRIPTION_MAX_LENGTH);
}

function clampPostContent(value: string): string {
  let result = "";
  let length = 0;

  for (const char of value) {
    const nextLength = length + (char === "\n" ? 2 : 1);
    if (nextLength > POST_CONTENT_MAX_LENGTH) break;
    result += char;
    length = nextLength;
  }

  return result;
}

function getSubmittedPostContentLength(value: string): number {
  let length = 0;
  for (const char of value) {
    length += char === "\n" ? 2 : 1;
  }
  return length;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getTotalFileBytes(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0);
}

function getEstimatedTransportBytes(files: File[]): number {
  return Math.ceil((getTotalFileBytes(files) * 4) / 3);
}



function authorName(author: CommunityArticle["author"] | CommunityPost["author"] | CommunityComment["author"]): string {
  if (!author) return "Member";
  // If author is a string (unpopulated ObjectId), we can't show a name
  if (typeof author === "string") return "Member";
  // Try all possible name fields from different user models
  return author.name || author.username || author.email || "Member";
}



/** Only pass URLs the browser can load; invalid strings avoid a broken <img> request. */

function isDisplayableImageSrc(src: string): boolean {

  const s = src.trim();

  if (!s) return false;

  return (

    s.startsWith("https://") ||

    s.startsWith("http://") ||

    s.startsWith("blob:") ||

    s.startsWith("data:image/")

  );

}



/**

 * S3 objects often block hotlinked browser requests (Referer / ACL). Load via same-origin proxy.

 * Blob/data URLs and non-S3 https stay as-is.

 */

function avatarImgSrcForDisplay(url: string): string {

  const s = url.trim();

  if (!s || s.startsWith("blob:") || s.startsWith("data:")) return s;

  try {

    const u = new URL(s);

    if (

      u.protocol === "https:" &&

      u.hostname.toLowerCase().endsWith(".amazonaws.com") &&

      u.hostname.toLowerCase().includes(".s3.")

    ) {

      return `/api/avatar?url=${encodeURIComponent(s)}`;

    }

  } catch {

    return s;

  }

  return s;

}



function authorPic(author: CommunityArticle["author"] | CommunityPost["author"] | CommunityComment["author"]): string | undefined {

  if (!author || typeof author === "string") return undefined;

  return (

    author.profilePictureUrl ||

    author.profilePicture ||

    author.avatar ||

    (author as Record<string, string | undefined>).photo ||

    (author as Record<string, string | undefined>).image ||

    (author as Record<string, string | undefined>).imageUrl

  );

}



function currentUserPic(user: unknown, account?: { data?: { avatarUrl?: string } }): string | undefined {

  if (!user || typeof user !== "object") return undefined;

  const u = user as Record<string, string | null | undefined>;

  const accountData = account?.data;

  return (

    accountData?.avatarUrl ||

    u.profilePicture ||

    u.avatar ||

    u.photo ||

    u.image ||

    u.imageUrl ||

    undefined

  );

}



function initials(name: string) {

  return name

    .split(/\s+/)

    .map((p) => p[0])

    .join("")

    .slice(0, 2)

    .toUpperCase() || "V";

}

// Generate a default avatar URL using the user's name
function getDefaultAvatarUrl(name: string): string {
  // Use a reliable avatar service with the user's name/initials
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";
  
  // Using DiceBear API for consistent avatars
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initials)}&backgroundColor=6366f1&color=fff`;
}



function readMinutes(article: CommunityArticle): number | null {

  if (article.wordCount && article.wordCount > 0) {

    return Math.max(1, Math.ceil(article.wordCount / 200));

  }

  return null;

}




function getArticleCardImages(article: CommunityArticle): string[] {

  if (!article) return [];

  

  // Collect all possible images

  const coverImage = article.coverImage ? [article.coverImage.trim()] : [];

  const articleImages = (article.images ?? []).map(img => img.trim()).filter(Boolean);

  const blockImages = (article.contentBlocks ?? [])

    .filter((b) => b.type === "image" && b.url)

    .map((b) => String(b.url).trim())

    .filter(Boolean);

  

  // Combine and deduplicate

  const allImages = [...coverImage, ...articleImages, ...blockImages];

  return Array.from(new Set(allImages));

}



function ArticleCardImage({ images, alt }: { images: string[]; alt: string }) {

  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());



  const handleImageLoad = (index: number) => {

    setLoadedImages(prev => new Set(prev).add(index));

  };



  const handleImageError = (index: number) => {

    setFailedImages(prev => new Set(prev).add(index));

  };



  const displayImages = images.slice(0, 4); // Show max 4 images in card

  const hasMoreImages = images.length > 4;

  const extraCount = images.length - 4;



  if (displayImages.length === 0) {

    return (

      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 to-muted">

        <BookOpen className="h-10 w-10 text-primary/60" />

      </div>

    );

  }



  // Single image - full width with proper aspect ratio

  if (displayImages.length === 1) {

    const safeSrc = articleImgSrcForDisplay(displayImages[0]);

    const isFailed = failedImages.has(0);

    

    if (isFailed) {

      return (

        <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 to-muted">

          <BookOpen className="h-10 w-10 text-primary/60" />

        </div>

      );

    }



    return (

      <div className="relative h-full w-full overflow-hidden">

        <img

          src={safeSrc}

          alt={alt}

          className="h-full w-full object-contain transition-transform duration-300 hover:scale-[1.02]"

          loading="lazy"

          referrerPolicy="no-referrer"

          onLoad={() => handleImageLoad(0)}

          onError={() => handleImageError(0)}

        />

        {!loadedImages.has(0) && (

          <div className="absolute inset-0 animate-pulse bg-muted/20" />

        )}

      </div>

    );

  }



  // Two images - side by side

  if (displayImages.length === 2) {

    return (

      <div className="grid h-full w-full grid-cols-2 gap-1">

        {displayImages.map((image, index) => {

          const safeSrc = articleImgSrcForDisplay(image);

          const isFailed = failedImages.has(index);

          

          if (isFailed) return null;



          return (

            <div key={index} className="relative overflow-hidden">

              <img

                src={safeSrc}

                alt={`${alt} ${index + 1}`}

                className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"

                loading="lazy"

                referrerPolicy="no-referrer"

                onLoad={() => handleImageLoad(index)}

                onError={() => handleImageError(index)}

              />

              {!loadedImages.has(index) && (

                <div className="absolute inset-0 animate-pulse bg-muted/20" />

              )}

            </div>

          );

        })}

      </div>

    );

  }



  // Three images - one large, two small

  if (displayImages.length === 3) {

    return (

      <div className="grid h-full w-full grid-cols-2 gap-1">

        <div className="col-span-1 relative overflow-hidden">

          {(() => {

            const safeSrc = articleImgSrcForDisplay(displayImages[0]);

            const isFailed = failedImages.has(0);

            

            if (isFailed) return null;



            return (

              <img

                src={safeSrc}

                alt={`${alt} 1`}

                className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"

                loading="lazy"

                referrerPolicy="no-referrer"

                onLoad={() => handleImageLoad(0)}

                onError={() => handleImageError(0)}

              />

            );

          })()}

          {!loadedImages.has(0) && (

            <div className="absolute inset-0 animate-pulse bg-muted/20" />

          )}

        </div>

        <div className="col-span-1 grid grid-rows-2 gap-1">

          {displayImages.slice(1).map((image, index) => {

            const actualIndex = index + 1;

            const safeSrc = articleImgSrcForDisplay(image);

            const isFailed = failedImages.has(actualIndex);

            

            if (isFailed) return null;



            return (

              <div key={actualIndex} className="relative overflow-hidden">

                <img

                  src={safeSrc}

                  alt={`${alt} ${actualIndex + 1}`}

                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"

                  loading="lazy"

                  referrerPolicy="no-referrer"

                  onLoad={() => handleImageLoad(actualIndex)}

                  onError={() => handleImageError(actualIndex)}

                />

                {!loadedImages.has(actualIndex) && (

                  <div className="absolute inset-0 animate-pulse bg-muted/20" />

                )}

              </div>

            );

          })}

        </div>

      </div>

    );

  }



  // Four images - 2x2 grid

  return (

    <div className="grid h-full w-full grid-cols-2 gap-1">

      {displayImages.map((image, index) => {

        const safeSrc = articleImgSrcForDisplay(image);

        const isFailed = failedImages.has(index);

        

        if (isFailed) return null;



        return (

          <div key={index} className="relative overflow-hidden">

            <img

              src={safeSrc}

              alt={`${alt} ${index + 1}`}

              className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"

              loading="lazy"

              referrerPolicy="no-referrer"

              onLoad={() => handleImageLoad(index)}

              onError={() => handleImageError(index)}

            />

            {!loadedImages.has(index) && (

              <div className="absolute inset-0 animate-pulse bg-muted/20" />

            )}

            {/* Overlay for extra images indicator */}

            {hasMoreImages && index === 3 && (

              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">

                <div className="text-center">

                  <div className="text-2xl font-bold text-white">+{extraCount}</div>

                  <div className="text-xs text-white/80">more</div>

                </div>

              </div>

            )}

          </div>

        );

      })}

    </div>

  );

}



function pickPostImages(post: CommunityPost): string[] {

  const values = [

    ...(post.images ?? []),

    ...(post.image ? [post.image] : []),

  ];

  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

}

function pickPostVideos(post: CommunityPost): string[] {

  const values = [

    ...(post.videos ?? []),

    ...(post.video ? [post.video] : []),

  ];

  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

}

function PostMediaGallery({ images, videos }: { images: string[]; videos: string[] }) {

  if (images.length === 0 && videos.length === 0) return null;

  return (

    <div className="space-y-3">

      {/* LinkedIn-style Image Gallery */}
      {images.length > 0 && (
        <LinkedInImageGalleryWithLightbox images={images} />
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div className="space-y-3">
          {videos.map((video, index) => (
            <video
              key={`${video}-${index}`}
              src={video}
              controls
              preload="metadata"
              className="max-h-[28rem] w-full rounded-xl border bg-black"
            />
          ))}
        </div>
      )}
    </div>

  );

}



function resolveOriginalPost(post: CommunityPost): CommunityPost | null {

  if (post.originalPost && typeof post.originalPost === "object") return post.originalPost;

  if (post.sharedPost && typeof post.sharedPost === "object") return post.sharedPost;

  if ((post as unknown as { original_post?: CommunityPost }).original_post) {

    return (post as unknown as { original_post?: CommunityPost }).original_post ?? null;

  }

  if ((post as unknown as { repost?: CommunityPost }).repost) {

    return (post as unknown as { repost?: CommunityPost }).repost ?? null;

  }

  return null;

}



async function fetchAllRepostUsersForPost(postId: string): Promise<CommunityAuthor[]> {

  const seen = new Set<string>();

  const users: CommunityAuthor[] = [];

  const limit = 50;

  let page = 1;

  let totalPages = 1;



  while (page <= totalPages) {

    const payload = await fetchPosts(page, limit);

    totalPages = Math.max(1, payload.totalPages ?? 1);

    for (const post of payload.posts ?? []) {

      const original = resolveOriginalPost(post);

      if (!original || original._id !== postId) continue;

      if (!post.author || typeof post.author === "string") continue;

      const key = post.author._id ?? post.author.email ?? post.author.name ?? "";

      if (!key || seen.has(key)) continue;

      seen.add(key);

      users.push(post.author);

    }

    page += 1;

  }



  return users;

}



function isMostlyArabic(text?: string): boolean {

  if (!text) return false;

  const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length;

  const latinCount = (text.match(/[A-Za-z]/g) || []).length;

  return arabicCount > latinCount && arabicCount > 6;

}



function FeedEndSentinel({

  hasNext,

  isFetchingNext,

  onLoadMore,

}: {

  hasNext: boolean;

  isFetchingNext: boolean;

  onLoadMore: () => void;

}) {

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {

    const el = ref.current;

    if (!el || !hasNext) return;

    const io = new IntersectionObserver(

      (entries) => {

        if (entries[0]?.isIntersecting && !isFetchingNext) {

          onLoadMore();

        }

      },

      { root: null, rootMargin: "200px", threshold: 0 },

    );

    io.observe(el);

    return () => io.disconnect();

  }, [hasNext, isFetchingNext, onLoadMore]);



  if (!hasNext) {

    return null;

  }



  return (

    <div

      ref={ref}

      className="flex min-h-14 items-center justify-center text-sm text-muted-foreground"

      aria-hidden

    >

      {isFetchingNext ? <Loader2 className="h-5 w-5 animate-spin" /> : null}

    </div>

  );

}



export type CommunityPageClientProps = {

  area: "student" | "instructor";

  userId: string;

  initialTab?: "articles" | "feed";

  viewMode?: "articles" | "feed" | "both";

};



export default function CommunityPageClient({

  area,

  userId,

  initialTab = "feed",

  viewMode = "both",

}: CommunityPageClientProps) {

  const { user, role } = useAuthContext();

  const { toast } = useToast();

  const qc = useQueryClient();

  const router = useRouter();

  const isAdmin = role === "ADMIN";



  const [tab, setTab] = useState<"articles" | "feed">(initialTab);

  const activeTab = viewMode === "both" ? tab : viewMode;

  const showArticleControls = activeTab === "articles";

  const handleTabChange = (nextTab: "articles" | "feed") => {

    if (viewMode !== "both") return;

    setTab(nextTab);

    const basePath = `/${area}/${userId}/community`;

    if (nextTab === "articles") {

      router.push(`${basePath}/articles`);

      return;

    }

    router.push(basePath);

  };



  const [articlePage, setArticlePage] = useState(1);

  const [category, setCategory] = useState<CommunityArticleCategory | "all">("all");

  const [createOpen, setCreateOpen] = useState(false);

  const [newTitle, setNewTitle] = useState("");

  const [newDescription, setNewDescription] = useState("");

  const [newBody, setNewBody] = useState("");

  const [newCats, setNewCats] = useState<CommunityArticleCategory[]>(["frontend"]);

  const [articleTopic, setArticleTopic] = useState("");

  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);

  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [articleEditOpen, setArticleEditOpen] = useState(false);

  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  const [editArticleTitle, setEditArticleTitle] = useState("");

  const [editArticleDescription, setEditArticleDescription] = useState("");

  const [editArticleBody, setEditArticleBody] = useState("");

  const [editArticleCats, setEditArticleCats] = useState<CommunityArticleCategory[]>(["frontend"]);



  const [postContent, setPostContent] = useState("");

  const [postFiles, setPostFiles] = useState<File[]>([]);

  const [postVideos, setPostVideos] = useState<File[]>([]);

  const [postComposerOpen, setPostComposerOpen] = useState(false);

  const [postScope, setPostScope] = useState<"all" | "mine">("all");

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const [commentFiles, setCommentFiles] = useState<Record<string, File | null>>({});

  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const [replyFiles, setReplyFiles] = useState<Record<string, File | null>>({});

  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  const [shareComposerOpen, setShareComposerOpen] = useState(false);

  const [shareTargetPost, setShareTargetPost] = useState<CommunityPost | null>(null);

  const [shareCommentDraft, setShareCommentDraft] = useState("");

  const postPhotoInputRef = useRef<HTMLInputElement>(null);

  const postVideoInputRef = useRef<HTMLInputElement>(null);



  const articleParams = useMemo(

    () => ({

      page: articlePage,

      limit: 9,

      ...(category !== "all" ? { category } : {}),

    }),

    [articlePage, category],

  );



  const articlesQuery = useQuery({

    queryKey: ["community", "articles", articleParams],

    queryFn: () => fetchArticles(articleParams),

    retry: 2,

    staleTime: 30_000,

  });



  const { data: account } = useQuery({

    queryKey: ["account", userId],

    queryFn: () => getAccountMutationFn(userId),

    enabled: !!userId && userId !== "undefined",

  });



  const postsInfinite = useInfiniteQuery({

    queryKey: ["community", "posts", postScope, userId || "session"],

    queryFn: ({ pageParam }) =>

      postScope === "mine"

        ? fetchPostsByUser(userId, pageParam, 10)

        : fetchPosts(pageParam, 10),

    initialPageParam: 1,

    getNextPageParam: (lastPage) => {

      const page = lastPage.page ?? 1;

      const totalPages = lastPage.totalPages ?? 0;

      if (totalPages <= 0) {

        return undefined;

      }

      return page < totalPages ? page + 1 : undefined;

    },

    retry: 2,

    staleTime: 30_000,

    enabled: postScope === "all" ? true : Boolean(userId),

  });



  const feedPosts = useMemo(() => {

    const rows = postsInfinite.data?.pages.flatMap((p) => p.posts) ?? [];

    const seen = new Set<string>();

    return rows.filter((p) => {

      if (seen.has(p._id)) return false;

      seen.add(p._id);

      if (postScope !== "all") return true;

      const authorId =

        p.author && typeof p.author === "object" ? p.author._id : undefined;

      return !(user?._id && authorId && authorId === user._id);

    });

  }, [postScope, postsInfinite.data?.pages, user?._id]);



  const postsTotal = postsInfinite.data?.pages[0]?.total;



  const repostUsersByPostId = useMemo(() => {

    const byPost = new Map<string, CommunityAuthor[]>();

    for (const post of feedPosts) {

      const original = resolveOriginalPost(post);

      if (!original?._id) continue;

      if (!post.author || typeof post.author === "string") continue;

      const current = byPost.get(original._id) ?? [];

      if (!current.some((u) => u._id && post.author && typeof post.author === "object" && u._id === post.author._id)) {

        current.push(post.author);

      }

      byPost.set(original._id, current);

    }

    return byPost;

  }, [feedPosts]);



  const loadMorePosts = useCallback(() => {

    if (postsInfinite.hasNextPage && !postsInfinite.isFetchingNextPage) {

      void postsInfinite.fetchNextPage();

    }

  }, [postsInfinite]);



  const commentsQuery = useQuery({

    queryKey: ["community", "comments", expandedPostId],

    queryFn: () => fetchComments(expandedPostId as string, 1, 30),

    enabled: Boolean(expandedPostId),

  });



  const createArticleMut = useMutation({

    mutationFn: () =>

      createArticle({

        title: newTitle.trim(),

        description: clampArticleDescription(newDescription.trim()),

        category: newCats,

        contentBlocks: [

          { type: "paragraph", order: 0, content: newBody.trim() || " " },

        ],

        coverFiles: coverFile ? [coverFile] : undefined,

      }),

    onSuccess: () => {

      toast({ title: "Article submitted", description: "Your article was created." });

      setCreateOpen(false);

      setNewTitle("");

      setNewDescription("");

      setNewBody("");

      setCoverFile(null);

      void qc.invalidateQueries({ queryKey: ["community", "articles"] });

    },

    onError: (e: unknown) => {

      const raw =

        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "";

      const msg =

        /E11000 duplicate key|dup key/i.test(raw)

          ? "That article URL (slug) is already taken. Change the title or try again."

          : raw || "Could not create article.";

      toast({ title: "Error", description: msg, variant: "destructive" });

    },

  });

  const updateArticleMut = useMutation({

    mutationFn: () =>

      updateArticle({

        id: editingArticleId as string,

        title: editArticleTitle.trim(),

        description: clampArticleDescription(editArticleDescription.trim()),

        category: editArticleCats,

        contentBlocks: [{ type: "paragraph", order: 0, content: editArticleBody.trim() || " " }],

      }),

    onSuccess: () => {

      toast({ title: "Article updated" });

      setArticleEditOpen(false);

      setEditingArticleId(null);

      void qc.invalidateQueries({ queryKey: ["community", "articles"] });

    },

    onError: (e: unknown) => {

      const msg =

        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??

        "Could not update article.";

      toast({ title: "Error", description: msg, variant: "destructive" });

    },

  });

  const approveArticleMut = useMutation({

    mutationFn: (id: string) => approveArticle(id),

    onSuccess: () => {

      toast({ title: "Article approved" });

      void qc.invalidateQueries({ queryKey: ["community", "articles"] });

    },

    onError: (e: unknown) => {

      const msg =

        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??

        "Could not approve article.";

      toast({ title: "Error", description: msg, variant: "destructive" });

    },

  });

  const deleteArticleMut = useMutation({

    mutationFn: (id: string) => deleteArticle(id),

    onSuccess: () => {

      toast({ title: "Article deleted" });

      void qc.invalidateQueries({ queryKey: ["community", "articles"] });

    },

    onError: (e: unknown) => {

      const msg =

        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??

        "Could not delete article.";

      toast({ title: "Error", description: msg, variant: "destructive" });

    },

  });



  const handleGenerateArticleWithAI = async () => {

    const topic = (newTitle.trim() || articleTopic.trim()).trim();

    if (!topic) {

      toast({ title: "Topic required", description: "Enter a topic or title first.", variant: "destructive" });

      return;

    }

    setIsGeneratingArticle(true);

    try {

      const generated = await generateArticleWithAIMutationFn(topic);

      const allowed = new Set<CommunityArticleCategory>([

        "architecture",

        "devops",

        "backend",

        "databases",

        "frontend",

        "mobile",

        "ai",

        "security",

      ]);

      const category: CommunityArticleCategory = allowed.has(generated.category)

        ? generated.category

        : "backend";

      setNewTitle((generated.title || topic).trim());

      setNewDescription(clampArticleDescription((generated.summary || "AI-generated summary").trim()));

      setNewBody((generated.body || "AI-generated article body").trim());

      setNewCats([category]);

      toast({ title: "Generated", description: "Article draft was generated with AI." });

    } catch (e: unknown) {

      const msg = e instanceof Error ? e.message : "Could not generate article.";

      toast({ title: "Error", description: msg, variant: "destructive" });

    } finally {

      setIsGeneratingArticle(false);

    }

  };





  const createPostMut = useMutation({

    mutationFn: () =>

      createPost({

        content: clampPostContent(postContent.trim()),

        files: postFiles,

        videos: postVideos,

      }),

    onSuccess: () => {

      setPostContent("");

      setPostFiles([]);

      setPostVideos([]);

      setPostComposerOpen(false);

      toast({ title: "Posted" });

      void qc.invalidateQueries({ queryKey: ["community", "posts"] });

    },

    onError: (e: unknown) => {

      const msg =

        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??

        "Could not publish post.";

      toast({ title: "Error", description: msg, variant: "destructive" });

    },

  });

  const validatePostMediaSelection = useCallback(
    (nextFiles: File[], nextVideos: File[]) => {
      const mediaFiles = [...nextFiles, ...nextVideos];
      const estimatedTransportBytes = getEstimatedTransportBytes(mediaFiles);

      if (estimatedTransportBytes <= POST_MEDIA_MAX_BYTES) {
        return true;
      }

      toast({
        title: "Media too large",
        description: `Attached photos and videos exceed the current upload limit (${formatBytes(POST_MEDIA_MAX_BYTES)} total after encoding). Reduce the number or size of files and try again.`,
        variant: "destructive",
      });
      return false;
    },
    [toast],
  );

  const handlePostPhotoSelection = useCallback(
    (newFiles: File[]) => {
      if (!validatePostMediaSelection(newFiles, postVideos)) return;
      
      setPostFiles(prevFiles => {
        // Create a map to track existing files by name and size for duplicate detection
        const existingFilesMap = new Map(
          prevFiles.map(file => [`${file.name}-${file.size}`, file])
        );
        
        // Filter out duplicates and add new files
        const uniqueNewFiles = newFiles.filter(file => {
          const key = `${file.name}-${file.size}`;
          if (existingFilesMap.has(key)) {
            return false; // Skip duplicate
          }
          existingFilesMap.set(key, file);
          return true;
        });
        
        // Combine existing files with new unique files
        const combinedFiles = [...prevFiles, ...uniqueNewFiles];
        
        // Enforce maximum limit (10 images)
        if (combinedFiles.length > 10) {
          toast({
            title: "Too many images",
            description: "Maximum 10 images allowed per post. Some images were not added.",
            variant: "destructive",
          });
          return combinedFiles.slice(0, 10);
        }
        
        return combinedFiles;
      });
    },
    [postVideos, validatePostMediaSelection, toast],
  );

  const handlePostVideoSelection = useCallback(
    (newVideos: File[]) => {
      if (!validatePostMediaSelection(postFiles, newVideos)) return;
      
      setPostVideos(prevVideos => {
        // Create a map to track existing videos by name and size for duplicate detection
        const existingVideosMap = new Map(
          prevVideos.map(video => [`${video.name}-${video.size}`, video])
        );
        
        // Filter out duplicates and add new videos
        const uniqueNewVideos = newVideos.filter(video => {
          const key = `${video.name}-${video.size}`;
          if (existingVideosMap.has(key)) {
            return false; // Skip duplicate
          }
          existingVideosMap.set(key, video);
          return true;
        });
        
        // Combine existing videos with new unique videos
        const combinedVideos = [...prevVideos, ...uniqueNewVideos];
        
        // Enforce maximum limit (5 videos)
        if (combinedVideos.length > 5) {
          toast({
            title: "Too many videos",
            description: "Maximum 5 videos allowed per post. Some videos were not added.",
            variant: "destructive",
          });
          return combinedVideos.slice(0, 5);
        }
        
        return combinedVideos;
      });
    },
    [postFiles, validatePostMediaSelection, toast],
  );

  const handleCreatePost = () => {
    const trimmedPostContent = postContent.trim();
    if (getSubmittedPostContentLength(trimmedPostContent) > POST_CONTENT_MAX_LENGTH) {
      toast({
        title: "Post too long",
        description: `Post content must be ${POST_CONTENT_MAX_LENGTH} characters or less.`,
        variant: "destructive",
      });
      return;
    }

    if (!validatePostMediaSelection(postFiles, postVideos)) {
      return;
    }

    createPostMut.mutate();
  };



  const likePostMut = useMutation({

    mutationFn: (postId: string) => togglePostLike(postId),

    onSuccess: () => void qc.invalidateQueries({ queryKey: ["community", "posts"] }),

  });



  const sharePostMut = useMutation({

    mutationFn: ({ postId, comment }: { postId: string; comment?: string }) => sharePost(postId, comment),

    onSuccess: async (data) => {

      if (data.shareableLink && typeof navigator !== "undefined" && navigator.clipboard) {

        await navigator.clipboard.writeText(data.shareableLink);

        toast({ title: "Link copied", description: "Share link is on your clipboard." });

      }

      setShareComposerOpen(false);

      setShareTargetPost(null);

      setShareCommentDraft("");

      toast({ title: "Reposted", description: "Your repost is now published." });

      void qc.invalidateQueries({ queryKey: ["community", "posts"] });

    },

    onError: (e: unknown) => {

      const msg =

        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??

        "Could not share.";

      toast({ title: "Error", description: msg, variant: "destructive" });

    },

  });



  const openShareComposer = (post: CommunityPost) => {

    setShareTargetPost(post);

    setShareCommentDraft("");

    setShareComposerOpen(true);

  };

  const openEditArticle = (article: CommunityArticle) => {

    setEditingArticleId(article._id);

    setEditArticleTitle(article.title ?? "");

    setEditArticleDescription(clampArticleDescription(article.description ?? ""));

    const paragraphBlock = (article.contentBlocks ?? []).find((b) => b.type === "paragraph");

    setEditArticleBody(paragraphBlock?.content ?? "");

    setEditArticleCats((article.category?.length ? article.category : ["frontend"]) as CommunityArticleCategory[]);

    setArticleEditOpen(true);

  };



  const deletePostMut = useMutation({

    mutationFn: (postId: string) => deletePost(postId),

    onSuccess: () => {

      toast({ title: "Post deleted" });

      void qc.invalidateQueries({ queryKey: ["community", "posts"] });

    },

    onError: (e: unknown) => {

      const msg =

        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??

        "Could not delete post.";

      toast({ title: "Error", description: msg, variant: "destructive" });

    },

  });



  const createCommentMut = useMutation({

    mutationFn: ({ postId, text, image }: { postId: string; text: string; image?: File }) =>

      createComment(postId, text, image),

    onSuccess: (_, v) => {

      setCommentDrafts((d) => ({ ...d, [v.postId]: "" }));

      setCommentFiles((files) => ({ ...files, [v.postId]: null }));

      void qc.invalidateQueries({ queryKey: ["community", "comments", v.postId] });

      void qc.invalidateQueries({ queryKey: ["community", "posts"] });

      toast({ title: "Comment added" });

    },

    onError: (e: unknown) => {

      const msg =

        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??

        "Could not comment.";

      toast({ title: "Error", description: msg, variant: "destructive" });

    },

  });

  const updatePostMut = useMutation({

    mutationFn: ({ postId, content }: { postId: string; content: string }) =>

      updatePost(postId, { content: clampPostContent(content.trim()) }),

    onSuccess: () => {

      toast({ title: "Post updated" });

      void qc.invalidateQueries({ queryKey: ["community", "posts"] });

    },

    onError: (e: unknown) => {

      const msg =

        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??

        "Could not update post.";

      toast({ title: "Error", description: msg, variant: "destructive" });

    },

  });

  const updateCommentMut = useMutation({

    mutationFn: ({ commentId, text }: { commentId: string; text: string }) =>

      updateComment(commentId, text),

    onSuccess: () => {

      toast({ title: "Comment updated" });

      void qc.invalidateQueries({ queryKey: ["community", "comments", expandedPostId] });

      void qc.invalidateQueries({ queryKey: ["community", "posts"] });

    },

    onError: (e: unknown) => {

      const msg =

        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??

        "Could not update comment.";

      toast({ title: "Error", description: msg, variant: "destructive" });

    },

  });



  const deleteCommentMut = useMutation({

    mutationFn: (commentId: string) => deleteComment(commentId),

    onSuccess: () => {

      void qc.invalidateQueries({ queryKey: ["community", "comments", expandedPostId] });

      void qc.invalidateQueries({ queryKey: ["community", "posts"] });

      toast({ title: "Comment removed" });

    },

    onError: (e: unknown) => {

      const msg =

        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??

        "Could not remove comment.";

      toast({ title: "Error", description: msg, variant: "destructive" });

    },

  });



  const likeCommentMut = useMutation({

    mutationFn: (commentId: string) => toggleCommentLike(commentId),

    onSuccess: () =>

      void qc.invalidateQueries({ queryKey: ["community", "comments", expandedPostId] }),

  });

  // Create reply mutation with optimistic update
  const createReplyMut = useMutation({
    mutationFn: ({ 
      postId, 
      parentCommentId, 
      text, 
      image 
    }: { 
      postId: string; 
      parentCommentId: string; 
      text: string; 
      image?: File 
    }) => createReply(postId, parentCommentId, text, image),
    onSuccess: (data, variables) => {
      toast({ title: "Reply posted" });
      // Clear reply draft for the specific comment
      setReplyDrafts(prev => ({ ...prev, [variables.parentCommentId]: "" }));
      setReplyFiles(prev => ({ ...prev, [variables.parentCommentId]: null }));
      
      // Optimistically update the cache with the new reply
      qc.setQueryData<CommunityComment[]>(["community", "comments", expandedPostId], (oldComments) => {
        if (!oldComments) return oldComments;
        
        return oldComments.map(comment => {
          if (comment._id === variables.parentCommentId) {
            // Append the new reply to the comment's replies array
            return {
              ...comment,
              replies: [...(comment.replies || []), data],
              repliesCount: (comment.repliesCount || 0) + 1
            };
          }
          return comment;
        });
      });
      
      // Also invalidate to ensure consistency with server
      void qc.invalidateQueries({ queryKey: ["community", "comments", expandedPostId] });
    },
    onError: (e: unknown, variables) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not post reply.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  // Simplified replies queries - will be handled in PostCard component
  const repliesQueries: Record<string, any> = {};



  const goToArticles = useCallback(() => {

    const basePath = `/${area}/${userId}/community`;

    if (viewMode === "both") {

      setTab("articles");

      document.getElementById("community-articles")?.scrollIntoView({ behavior: "smooth" });

      return;

    }

    if (viewMode === "articles") {

      document.getElementById("community-articles")?.scrollIntoView({ behavior: "smooth" });

      return;

    }

    router.push(`${basePath}/articles`);

  }, [area, router, userId, viewMode]);



  const goToFeed = useCallback(() => {

    const basePath = `/${area}/${userId}/community`;

    if (viewMode === "both") {

      setTab("feed");

      document.getElementById("community-feed")?.scrollIntoView({ behavior: "smooth" });

      return;

    }

    if (viewMode === "feed") {

      document.getElementById("community-feed")?.scrollIntoView({ behavior: "smooth" });

      return;

    }

    router.push(basePath);

  }, [area, router, userId, viewMode]);

  // Reply handler functions
  const handleReplyToComment = useCallback((parentCommentId: string, text: string, image?: File) => {
    if (!expandedPostId) return;
    createReplyMut.mutate({ 
      postId: expandedPostId, 
      parentCommentId, 
      text, 
      image 
    });
  }, [expandedPostId, createReplyMut]);

  const handleToggleReplies = useCallback((commentId: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  }, []);

  const handleReplyChange = useCallback((commentId: string, text: string) => {
    setReplyDrafts(prev => ({
      ...prev,
      [commentId]: text
    }));
  }, []);

  const handleReplyImageChange = useCallback((commentId: string, file: File | null) => {
    setReplyFiles(prev => ({
      ...prev,
      [commentId]: file
    }));
  }, []);

  const hubLabel = area === "instructor" ? "Instructor hub" : "Student hub";



  return (

    <div className="min-h-full w-full pb-16">

      <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">

        <div

          aria-hidden

          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl"

        />

        <div

          aria-hidden

          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"

        />

        <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20 md:text-center">

          <Badge variant="secondary" className="mb-4 rounded-full px-3 py-1 text-xs font-medium">

            <Sparkles className="mr-1 inline h-3.5 w-3.5" />

            {hubLabel}

          </Badge>

          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">

            Learn together. Share what you build.

          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">

            A place where makers learn in public, share what they’re building, and grow 

            together through honest insights, practical guides, and meaningful conversations.

          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">

            <Button size="lg" className="rounded-full px-8" onClick={goToArticles}>

              <BookOpen className="mr-2 h-4 w-4" />

              Browse articles

            </Button>

            <Button

              size="lg"

              variant="outline"

              className="rounded-full border-primary/25 bg-background/60 backdrop-blur"

              onClick={goToFeed}

            >

              <Users className="mr-2 h-4 w-4" />

              Open the feed

            </Button>

          </div>

          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-3 text-center md:gap-6">

            {[

              { label: "Articles", value: articlesQuery.data?.pagination.total ?? "—" },

              { label: "Feed posts", value: postsTotal ?? "—" },

              { label: "You", value: user?.name ? initials(user.name) : "In" },

            ].map((s) => (

              <div

                key={s.label}

                className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5"

              >

                <div className="text-2xl font-semibold tabular-nums md:text-3xl">{s.value}</div>

                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">

                  {s.label}

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>



      <div className="mx-auto max-w-6xl px-4 pt-10">

        {articlesQuery.isError ? (

          <Alert variant="destructive" className="mb-8">

            <AlertTitle>Community API unavailable</AlertTitle>

            <AlertDescription>

              {(articlesQuery.error as Error)?.message ||

                "Could not load articles. Confirm the gateway exposes /api/v1/community/articles."}

            </AlertDescription>

          </Alert>

        ) : null}



        {showArticleControls ? (

          <>

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-2xl font-semibold tracking-tight">Explore topics</h2>

                <p className="text-sm text-muted-foreground">

                  Filter published articles by track—same category rhythm as EqraaTech’s guides.

                </p>

              </div>

              <Button

                className="w-fit rounded-full"

                onClick={() => setCreateOpen(true)}

                variant="default"

              >

                <PenLine className="mr-2 h-4 w-4" />

                New article

              </Button>

            </div>



            <ScrollArea className="pb-4">

              <div className="flex w-max gap-2 pb-1">

                <Button

                  type="button"

                  size="sm"

                  variant={category === "all" ? "default" : "outline"}

                  className="rounded-full"

                  onClick={() => {

                    setCategory("all");

                    setArticlePage(1);

                  }}

                >

                  All

                </Button>

                {CATEGORIES.map((c) => (

                  <Button

                    key={c}

                    type="button"

                    size="sm"

                    variant={category === c ? "default" : "outline"}

                    className="rounded-full capitalize"

                    onClick={() => {

                      setCategory(c);

                      setArticlePage(1);

                    }}

                  >

                    {c}

                  </Button>

                ))}

              </div>

            </ScrollArea>

          </>

        ) : null}



        <Tabs

          value={activeTab}

          onValueChange={(v) => handleTabChange(v as "articles" | "feed")}

          className="mt-8"

        >

          {viewMode === "both" ? (

            <TabsList className="h-auto w-full justify-start gap-1 rounded-2xl border border-border/60 bg-muted/40 p-1.5 md:w-auto">

              <TabsTrigger

                value="articles"

                className="rounded-xl px-5 py-2.5 data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:bg-background data-[state=active]:shadow-sm"

              >

                Articles

              </TabsTrigger>

              <TabsTrigger

                value="feed"

                className="rounded-xl px-5 py-2.5 data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:bg-background data-[state=active]:shadow-sm"

              >

                Community feed

              </TabsTrigger>

            </TabsList>

          ) : null}



          <TabsContent value="articles" className="mt-8 space-y-8">

            {articlesQuery.isLoading ? (

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {Array.from({ length: 6 }).map((_, i) => (

                  <Skeleton key={i} className="h-72 rounded-2xl" />

                ))}

              </div>

            ) : (

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {(articlesQuery.data?.data ?? []).map((article) => {

                  const mins = readMinutes(article);

                  const cardImages = getArticleCardImages(article);

                  const articleAuthorId =

                    typeof article.author === "string"

                      ? article.author

                      : article.author && typeof article.author === "object"

                        ? article.author._id

                        : undefined;

                  const canManageArticle = isAdmin || Boolean(user?._id && articleAuthorId && user._id === articleAuthorId);

                  return (

                    <div

                      key={article._id}

                      className="text-left"

                    >

                      <Card

                        className="h-full overflow-hidden rounded-2xl border-border/70 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"

                        onClick={() =>

                          router.push(`/${area}/${userId}/community/articles/${encodeURIComponent(article.slug)}`)

                        }

                      >

                        <div className="relative aspect-16/10 w-full bg-muted">

                          <ArticleCardImage images={cardImages} alt={article.title} />

                          <div className="absolute left-3 top-3 flex flex-wrap gap-1">

                            {article.category?.slice(0, 2).map((cat) => (

                              <Badge

                                key={cat}

                                variant="secondary"

                                className="rounded-full bg-background/85 capitalize backdrop-blur"

                              >

                                {cat}

                              </Badge>

                            ))}

                          </div>

                          {canManageArticle ? (

                            <div className="absolute right-3 top-3">

                              <DropdownMenu>

                                <DropdownMenuTrigger asChild>

                                  <Button

                                    type="button"

                                    variant="secondary"

                                    size="icon"

                                    className="h-9 w-9 rounded-full border border-border/70 bg-background/95 text-foreground shadow-sm backdrop-blur hover:bg-background"

                                    onClick={(e) => e.stopPropagation()}

                                  >

                                    <MoreHorizontal className="h-5 w-5" />

                                  </Button>

                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>

                                  <DropdownMenuItem

                                    onClick={(e) => {

                                      e.stopPropagation();

                                      openEditArticle(article);

                                    }}

                                  >

                                    Edit

                                  </DropdownMenuItem>

                                  {isAdmin && article.publishedStatus !== "published" ? (

                                    <DropdownMenuItem

                                      onClick={(e) => {

                                        e.stopPropagation();

                                        approveArticleMut.mutate(article._id);

                                      }}

                                      disabled={approveArticleMut.isPending}

                                    >

                                      Approve

                                    </DropdownMenuItem>

                                  ) : null}

                                  <DropdownMenuItem

                                    className="text-destructive focus:text-destructive"

                                    onClick={(e) => {

                                      e.stopPropagation();

                                      deleteArticleMut.mutate(article._id);

                                    }}

                                    disabled={deleteArticleMut.isPending}

                                  >

                                    Delete

                                  </DropdownMenuItem>

                                </DropdownMenuContent>

                              </DropdownMenu>

                            </div>

                          ) : null}

                        </div>

                        <CardHeader className="space-y-2 pb-2">

                          {article.publishedStatus ? (

                            <div className="px-6 pt-4">

                              <Badge

                                variant={article.publishedStatus === "published" ? "default" : "outline"}

                                className="rounded-full capitalize"

                              >

                                {article.publishedStatus}

                              </Badge>

                            </div>

                          ) : null}

                          <CardTitle className="line-clamp-2 text-lg leading-snug">

                            {article.title}

                          </CardTitle>

                          <CardDescription className="line-clamp-2">

                            {article.description}

                          </CardDescription>

                        </CardHeader>

                        <CardFooter className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">

                          <span className="flex items-center gap-2">

                            <Avatar className="h-7 w-7">

                              {authorPic(article.author) && isDisplayableImageSrc(authorPic(article.author)!) ? (

                                <AvatarImage

                                  src={avatarImgSrcForDisplay(authorPic(article.author)!)}

                                  className="object-cover"

                                  referrerPolicy="no-referrer"

                                />

                              ) : null}

                              <AvatarFallback>{initials(authorName(article.author))}</AvatarFallback>

                            </Avatar>

                            {authorName(article.author)}

                          </span>

                          <span>

                            {article.createdAt

                              ? formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })

                              : ""}

                            {mins ? ` · ${mins} min` : ""}

                          </span>

                        </CardFooter>

                      </Card>

                    </div>

                  );

                })}

              </div>

            )}

            {!articlesQuery.isLoading && (articlesQuery.data?.data?.length ?? 0) === 0 ? (

              <Alert>

                <AlertTitle>No articles yet</AlertTitle>

                <AlertDescription>

                  Nothing matched this filter. Try another category or click New article.

                </AlertDescription>

              </Alert>

            ) : null}



            <div className="flex items-center justify-center gap-4 pb-4">

              <Button

                type="button"

                variant="outline"

                size="sm"

                className="rounded-full"

                disabled={!articlesQuery.data?.pagination.hasPrev}

                onClick={() => setArticlePage((p) => Math.max(1, p - 1))}

              >

                <ChevronLeft className="h-4 w-4" />

                Prev

              </Button>

              <span className="text-sm text-muted-foreground">

                Page {articlesQuery.data?.pagination.page ?? articlePage} of{" "}

                {Math.max(1, articlesQuery.data?.pagination.totalPages ?? 1)}

              </span>

              <Button

                type="button"

                variant="outline"

                size="sm"

                className="rounded-full"

                disabled={!articlesQuery.data?.pagination.hasNext}

                onClick={() => setArticlePage((p) => p + 1)}

              >

                Next

                <ChevronRight className="h-4 w-4" />

              </Button>

            </div>

          </TabsContent>



          <TabsContent value="feed" className="mt-8 space-y-6">

            <div id="community-feed" className="space-y-4">

              <Card className="rounded-2xl border-border/70 shadow-sm">

                <CardContent className="space-y-4 p-4 md:p-5">

                  <div className="flex w-full max-w-[1000px] flex-wrap items-center gap-3 sm:flex-nowrap">

                    <Avatar className="h-11 w-11">

                      {currentUserPic(user, account) && isDisplayableImageSrc(currentUserPic(user, account)!) ? (

                        <AvatarImage

                          src={avatarImgSrcForDisplay(currentUserPic(user, account)!)}

                          className="object-cover"

                          referrerPolicy="no-referrer"

                        />

                      ) : null}

                      <AvatarFallback>{initials(user?.name || "You")}</AvatarFallback>

                    </Avatar>

                    <Button

                      type="button"

                      variant="outline"

                      className="h-11 w-full min-w-0 justify-start rounded-full px-5 text-base text-muted-foreground sm:flex-1"

                      onClick={() => setPostComposerOpen(true)}

                    >

                      Start a post

                    </Button>

                  </div>

                  <div className="grid grid-cols-2 gap-2">

                    <Button

                      type="button"

                      variant="ghost"

                      className="justify-center rounded-lg border bg-muted/20 py-5 text-base"

                      onClick={() => {

                        postVideoInputRef.current?.click();

                        setPostComposerOpen(true);

                      }}

                    >

                      <Video className="mr-2 h-5 w-5 text-emerald-500" />

                      Video

                    </Button>

                    <Button

                      type="button"

                      variant="ghost"

                      className="justify-center rounded-lg border bg-muted/20 py-5 text-base"

                      onClick={() => {

                        postPhotoInputRef.current?.click();

                        setPostComposerOpen(true);

                      }}

                    >

                      <ImagePlus className="mr-2 h-5 w-5 text-blue-500" />

                      Photo

                    </Button>

                  </div>

                  <input
                    ref={postPhotoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    aria-label="Select post photos"
                    title="Select post photos"
                    onChange={(e) => {
                      handlePostPhotoSelection(Array.from(e.target.files ?? []));
                      // Reset input value to allow selecting the same files again
                      e.target.value = '';
                    }}
                  />

                  <input
                    ref={postVideoInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    aria-label="Select post videos"
                    title="Select post videos"
                    onChange={(e) => {
                      handlePostVideoSelection(Array.from(e.target.files ?? []));
                      // Reset input value to allow selecting the same files again
                      e.target.value = '';
                    }}
                  />

                </CardContent>

              </Card>



              <div className="flex flex-wrap items-center justify-between gap-3">

                <div className="inline-flex items-center rounded-full border bg-muted/20 p-1">

                  <Button

                    size="sm"

                    variant={postScope === "all" ? "default" : "ghost"}

                    className="rounded-full px-4"

                    onClick={() => setPostScope("all")}

                  >

                    All posts

                  </Button>

                  <Button

                    size="sm"

                    variant={postScope === "mine" ? "default" : "ghost"}

                    className="rounded-full px-4"

                    onClick={() => setPostScope("mine")}

                  >

                    My posts

                  </Button>

                </div>

                <span className="text-sm text-muted-foreground">

                  {postScope === "mine" ? "Showing your posts" : "Showing all community posts"}

                </span>

              </div>



              <div className="space-y-4">

                {postsInfinite.isError ? (

                  <Alert variant="destructive">

                    <AlertTitle>Could not load the feed</AlertTitle>

                    <AlertDescription>

                      {(postsInfinite.error as Error)?.message ||

                        "Check the network tab or confirm GET /api/v1/community/posts is available."}

                    </AlertDescription>

                  </Alert>

                ) : null}

                {postsInfinite.isPending ? (

                  <Skeleton className="h-40 w-full rounded-2xl" />

                ) : feedPosts.length === 0 ? (

                  <Card className="rounded-2xl border-dashed">

                    <CardContent className="p-8 text-center">

                      <p className="text-lg font-semibold">No posts yet</p>

                      <p className="mt-1 text-sm text-muted-foreground">

                        Be the first to publish an update to this community.

                      </p>

                    </CardContent>

                  </Card>

                ) : (

                  feedPosts.map((post) => {

                    const originalPost = resolveOriginalPost(post);

                    if (originalPost) {

                      return (

                        <RepostWrapper

                          key={post._id}

                          repost={post}

                          originalPost={originalPost}

                          userId={user?._id}

                          user={user}

                          account={account}

                          isAdmin={isAdmin}

                          expanded={expandedPostId === originalPost._id}

                          onToggleComments={() =>

                            setExpandedPostId((id) => (id === originalPost._id ? null : originalPost._id))

                          }

                          comments={commentsQuery.data?.comments ?? []}

                          commentsLoading={Boolean(

                            expandedPostId === originalPost._id && commentsQuery.isFetching,

                          )}

                          commentText={commentDrafts[originalPost._id] ?? ""}

                          commentImage={commentFiles[originalPost._id] ?? null}

                          onCommentChange={(t) =>

                            setCommentDrafts((d) => ({

                              ...d,

                              [originalPost._id]: t,

                            }))

                          }

                          onCommentImageChange={(f) =>

                            setCommentFiles((files) => ({

                              ...files,

                              [originalPost._id]: f,

                            }))

                          }

                          onSubmitComment={() => {

                            const t = (commentDrafts[originalPost._id] ?? "").trim();

                            const image = commentFiles[originalPost._id] ?? undefined;

                            if (!t) return;

                            createCommentMut.mutate({ postId: originalPost._id, text: t, image });

                          }}

                          onDeletePost={() => deletePostMut.mutate(post._id)}

                          onLike={() => likePostMut.mutate(originalPost._id)}

                          onShare={(post) => openShareComposer(post)}

                          onEditPost={(postId, content) => updatePostMut.mutate({ postId, content })}

                          onDeleteComment={(id) => deleteCommentMut.mutate(id)}

                          onEditComment={(commentId, text) =>

                            updateCommentMut.mutate({ commentId, text })

                          }

                          onLikeComment={(id) => likeCommentMut.mutate(id)}

                          onReplyToComment={handleReplyToComment}

                          onToggleReplies={handleToggleReplies}

                          expandedReplies={expandedReplies}

                          replyDrafts={replyDrafts}

                          replyFiles={replyFiles}

                          onReplyChange={handleReplyChange}

                          onReplyImageChange={handleReplyImageChange}

                          repliesQueries={repliesQueries}

                          repostUsers={repostUsersByPostId.get(originalPost._id) ?? []}

                        />

                      );

                    }



                    return (

                      <PostCard

                        key={post._id}

                        post={post}

                        userId={user?._id}

                        user={user}

                        account={account}

                        isAdmin={isAdmin}

                        expanded={expandedPostId === post._id}

                        onToggleComments={() =>

                          setExpandedPostId((id) => (id === post._id ? null : post._id))

                        }

                        comments={commentsQuery.data?.comments ?? []}

                        commentsLoading={Boolean(expandedPostId === post._id && commentsQuery.isFetching)}

                        commentText={commentDrafts[post._id] ?? ""}

                        commentImage={commentFiles[post._id] ?? null}

                        onCommentChange={(t) =>

                          setCommentDrafts((d) => ({

                            ...d,

                            [post._id]: t,

                          }))

                        }

                        onCommentImageChange={(f) =>

                          setCommentFiles((files) => ({

                            ...files,

                            [post._id]: f,

                          }))

                        }

                        onSubmitComment={() => {

                          const t = (commentDrafts[post._id] ?? "").trim();

                          const image = commentFiles[post._id] ?? undefined;

                          if (!t) return;

                          createCommentMut.mutate({ postId: post._id, text: t, image });

                        }}

                        onDeletePost={() => deletePostMut.mutate(post._id)}

                        onLike={() => likePostMut.mutate(post._id)}

                        onShare={(post) => openShareComposer(post)}

                        onEditPost={(postId, content) => updatePostMut.mutate({ postId, content })}

                        onDeleteComment={(id) => deleteCommentMut.mutate(id)}

                        onEditComment={(commentId, text) =>

                          updateCommentMut.mutate({ commentId, text })

                        }

                        onLikeComment={(id) => likeCommentMut.mutate(id)}

                        onReplyToComment={handleReplyToComment}

                        onToggleReplies={handleToggleReplies}

                        expandedReplies={expandedReplies}

                        replyDrafts={replyDrafts}

                        replyFiles={replyFiles}

                        onReplyChange={handleReplyChange}

                        onReplyImageChange={handleReplyImageChange}

                        repliesQueries={repliesQueries}

                        repostUsers={repostUsersByPostId.get(post._id) ?? []}

                      />

                    );

                  })

                )}

                <FeedEndSentinel

                  hasNext={Boolean(postsInfinite.hasNextPage)}

                  isFetchingNext={postsInfinite.isFetchingNextPage}

                  onLoadMore={loadMorePosts}

                />

              </div>

            </div>

          </TabsContent>

        </Tabs>

      </div>



      <Dialog open={postComposerOpen} onOpenChange={setPostComposerOpen}>

        <DialogContent className="flex h-[82vh] max-w-4xl flex-col overflow-hidden rounded-2xl p-0">

          <DialogHeader className="sr-only">

            <DialogTitle>Create post</DialogTitle>

          </DialogHeader>

          <div className="shrink-0 border-b px-6 py-4 pr-14">

            <div className="flex items-center gap-3">

              <Avatar className="h-12 w-12">

                {currentUserPic(user, account) && isDisplayableImageSrc(currentUserPic(user, account)!) ? (

                  <AvatarImage

                    src={avatarImgSrcForDisplay(currentUserPic(user, account)!)}

                    className="object-cover"

                    referrerPolicy="no-referrer"

                  />

                ) : (

                  <AvatarImage

                    src={getDefaultAvatarUrl(user?.name || "You")}

                    className="object-cover"

                    referrerPolicy="no-referrer"

                  />

                )}

              </Avatar>

              <div>

                <p className="text-lg font-semibold">{user?.name || "You"}</p>

                <p className="text-sm text-muted-foreground">Post to anyone</p>

              </div>

            </div>

          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">

            <Textarea

              placeholder="What do you want to talk about?"

              value={postContent}

              onChange={(e) => setPostContent(clampPostContent(e.target.value))}

              className="min-h-[50vh] resize-none border-0 p-0 text-3xl leading-tight shadow-none focus-visible:ring-0"

            />

            <p className="mt-3 text-right text-xs text-muted-foreground">

              {getSubmittedPostContentLength(postContent)}/{POST_CONTENT_MAX_LENGTH}

            </p>

            {/* Image Upload Zone */}
            {postFiles.length === 0 && (
              <div className="mt-4">
                <ImageUploadZone
                  onFilesSelected={handlePostPhotoSelection}
                  maxFiles={10}
                  maxSize={5 * 1024 * 1024} // 5MB per image
                  className="max-h-48"
                />
              </div>
            )}

            {/* Image Preview Gallery */}
            {postFiles.length > 0 && (
              <div className="mt-4">
                <ImagePreviewGallery
                  files={postFiles}
                  onRemove={(index) => {
                    const newFiles = postFiles.filter((_, i) => i !== index);
                    setPostFiles(newFiles);
                  }}
                  onEdit={(index, file) => {
                    // TODO: Implement image editing functionality
                    console.log('Edit image:', index, file);
                  }}
                  onAddMore={() => postPhotoInputRef.current?.click()}
                />
              </div>
            )}

            {/* Video Upload Zone */}
            {postVideos.length === 0 && (
              <div className="mt-4">
                <VideoUploadZone
                  onFilesSelected={handlePostVideoSelection}
                  maxFiles={5}
                  maxSize={200 * 1024 * 1024} // 200MB per video
                  className="max-h-48"
                />
              </div>
            )}

            {/* Video Preview Gallery */}
            {postVideos.length > 0 && (
              <div className="mt-4">
                <VideoPreviewGallery
                  files={postVideos}
                  onRemove={(index) => {
                    const newVideos = postVideos.filter((_, i) => i !== index);
                    setPostVideos(newVideos);
                  }}
                  onAddMore={() => postVideoInputRef.current?.click()}
                />
              </div>
            )}

            {postFiles.length > 0 || postVideos.length > 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Estimated upload payload: {formatBytes(getEstimatedTransportBytes([...postFiles, ...postVideos]))} / {formatBytes(POST_MEDIA_MAX_BYTES)}
              </p>
            ) : null}

          </div>

          <div className="shrink-0 border-t px-6 py-4">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div className="flex items-center gap-2">

                <Button

                  type="button"

                  variant="ghost"

                  className="rounded-full"

                  onClick={() => postVideoInputRef.current?.click()}

                >

                  <Video className="mr-2 h-4 w-4 text-emerald-500" />

                  Video

                </Button>

                <Button

                  type="button"

                  variant="ghost"

                  className="rounded-full"

                  onClick={() => postPhotoInputRef.current?.click()}

                >

                  <ImagePlus className="mr-2 h-4 w-4 text-blue-500" />

                  Photo

                </Button>

              </div>

              <Button

                type="button"

                className="rounded-full px-6"

                disabled={

                  (!postContent.trim() && postFiles.length === 0 && postVideos.length === 0) ||

                  createPostMut.isPending

                }

                onClick={handleCreatePost}

              >

                {createPostMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}

              </Button>

            </div>

          </div>

        </DialogContent>

      </Dialog>



      <Dialog

        open={shareComposerOpen}

        onOpenChange={(open) => {

          setShareComposerOpen(open);

          if (!open) {

            setShareTargetPost(null);

            setShareCommentDraft("");

          }

        }}

      >

        <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden rounded-2xl p-0">

          <DialogHeader className="shrink-0 border-b px-6 py-4">

            <DialogTitle>Repost</DialogTitle>

          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">

            <div className="flex items-start gap-3">

              <Avatar className="h-10 w-10">

                {currentUserPic(user, account) && isDisplayableImageSrc(currentUserPic(user, account)!) ? (

                  <AvatarImage

                    src={avatarImgSrcForDisplay(currentUserPic(user, account)!)}

                    className="object-cover"

                    referrerPolicy="no-referrer"

                  />

                ) : null}

                <AvatarFallback>{initials(user?.name || "You")}</AvatarFallback>

              </Avatar>

              <Textarea

                value={shareCommentDraft}

                onChange={(e) => setShareCommentDraft(e.target.value)}

                placeholder="Add a thought about this..."

                className="min-h-[96px] rounded-xl"

              />

            </div>



            {shareTargetPost ? (

              <div className="max-h-[52vh] overflow-y-auto rounded-2xl border border-border/70 bg-muted/20 p-3">

                <div className="mb-2 flex items-center gap-2">

                  <Avatar className="h-8 w-8">

                    {authorPic(shareTargetPost.author) && isDisplayableImageSrc(authorPic(shareTargetPost.author)!) ? (

                      <AvatarImage

                        src={avatarImgSrcForDisplay(authorPic(shareTargetPost.author)!)}

                        className="object-cover"

                        referrerPolicy="no-referrer"

                      />

                    ) : (

                      <AvatarImage

                        src={getDefaultAvatarUrl(authorName(shareTargetPost.author))}

                        className="object-cover"

                        referrerPolicy="no-referrer"

                      />

                    )}

                  </Avatar>

                  <div className="min-w-0">

                    <p className="truncate text-sm font-semibold">{authorName(shareTargetPost.author)}</p>

                    <p className="text-xs text-muted-foreground">

                      {shareTargetPost.createdAt

                        ? formatDistanceToNow(new Date(shareTargetPost.createdAt), { addSuffix: true })

                        : ""}

                    </p>

                  </div>

                </div>

                {shareTargetPost.content?.trim() ? (

                  <p

                    dir={isMostlyArabic(shareTargetPost.content) ? "rtl" : "ltr"}

                    className={cn(

                      "whitespace-pre-wrap text-sm",

                      isMostlyArabic(shareTargetPost.content) ? "text-right" : "text-left",

                    )}

                  >

                    {shareTargetPost.content}

                  </p>

                ) : null}

                <PostMediaGallery

                  images={pickPostImages(shareTargetPost)}

                  videos={pickPostVideos(shareTargetPost)}

                />

              </div>

            ) : null}



            <DialogFooter className="shrink-0">

              <Button variant="ghost" onClick={() => setShareComposerOpen(false)}>

                Cancel

              </Button>

              <Button

                onClick={() => {

                  if (!shareTargetPost?._id) return;

                  sharePostMut.mutate({

                    postId: shareTargetPost._id,

                    comment: shareCommentDraft.trim() || undefined,

                  });

                }}

                disabled={sharePostMut.isPending || !shareTargetPost?._id}

              >

                {sharePostMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Repost"}

              </Button>

            </DialogFooter>

          </div>

        </DialogContent>

      </Dialog>



      <Dialog open={createOpen} onOpenChange={setCreateOpen}>

        <DialogContent className="flex max-h-[min(90vh,44rem)] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl p-0">

          <div className="shrink-0 px-6 pt-6 pr-14">

            <DialogHeader>

              <DialogTitle>New article</DialogTitle>

            </DialogHeader>

          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">

            <div className="space-y-4">

              <div className="space-y-2">

                <Label htmlFor="ca-topic">Topic (for AI generation)</Label>

                <div className="flex gap-2">

                  <Input

                    id="ca-topic"

                    value={articleTopic}

                    onChange={(e) => setArticleTopic(e.target.value)}

                    className="rounded-xl"

                    placeholder="e.g. Clean Architecture in Node.js"

                  />

                  <Button

                    type="button"

                    variant="outline"

                    className="rounded-xl"

                    disabled={isGeneratingArticle}

                    onClick={() => void handleGenerateArticleWithAI()}

                  >

                    {isGeneratingArticle ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate with AI"}

                  </Button>

                </div>

              </div>

              <div className="space-y-2">

                <Label htmlFor="ca-title">Title</Label>

                <Input

                  id="ca-title"

                  value={newTitle}

                  onChange={(e) => setNewTitle(e.target.value)}

                  className="rounded-xl"

                />

              </div>

              <div className="space-y-2">

                <Label htmlFor="ca-desc">Summary</Label>

                <Textarea

                  id="ca-desc"

                  value={newDescription}

                  onChange={(e) => setNewDescription(clampArticleDescription(e.target.value))}

                  maxLength={ARTICLE_DESCRIPTION_MAX_LENGTH}

                  className="max-h-32 min-h-[80px] resize-y overflow-y-auto rounded-xl"

                />

                <p className="text-right text-xs text-muted-foreground">

                  {newDescription.length}/{ARTICLE_DESCRIPTION_MAX_LENGTH}

                </p>

              </div>

              <div className="space-y-2">

                <Label htmlFor="ca-body">Body</Label>

                <Textarea

                  id="ca-body"

                  value={newBody}

                  onChange={(e) => setNewBody(e.target.value)}

                  className="min-h-[140px] max-h-[min(40vh,18rem)] resize-y overflow-y-auto rounded-xl"

                />

              </div>

              <div className="space-y-2">

                <Label>Categories</Label>

                <div className="flex flex-wrap gap-2">

                  {CATEGORIES.map((c) => {

                    const on = newCats.includes(c);

                    return (

                      <Button

                        key={c}

                        type="button"

                        size="sm"

                        variant={on ? "default" : "outline"}

                        className="rounded-full capitalize"

                        onClick={() =>

                          setNewCats((prev) =>

                            on ? prev.filter((x) => x !== c) : [...prev, c],

                          )

                        }

                      >

                        {c}

                      </Button>

                    );

                  })}

                </div>

              </div>

              <div className="space-y-2">

                <Label htmlFor="ca-cover">Cover image (optional)</Label>

                <Input

                  id="ca-cover"

                  type="file"

                  accept="image/*"

                  onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}

                />

              </div>

            </div>

          </div>

          <div className="shrink-0 border-t bg-background px-6 py-4">

            <DialogFooter className="gap-2 sm:gap-0">

              <Button variant="ghost" onClick={() => setCreateOpen(false)}>

                Cancel

              </Button>

              <Button

                disabled={

                  !newTitle.trim() ||

                  !newDescription.trim() ||

                  newCats.length === 0 ||

                  createArticleMut.isPending

                }

                onClick={() => createArticleMut.mutate()}

              >

                {createArticleMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}

              </Button>

            </DialogFooter>

          </div>

        </DialogContent>

      </Dialog>



      <Dialog open={articleEditOpen} onOpenChange={setArticleEditOpen}>

        <DialogContent className="flex max-h-[78vh] w-[min(92vw,56rem)] max-w-4xl flex-col overflow-hidden rounded-2xl p-0">

          <DialogHeader className="shrink-0 border-b px-6 py-4">

            <DialogTitle>Edit article</DialogTitle>

          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4">

            <Input value={editArticleTitle} onChange={(e) => setEditArticleTitle(e.target.value)} />

            <Textarea

              value={editArticleDescription}

              onChange={(e) => setEditArticleDescription(clampArticleDescription(e.target.value))}

              maxLength={ARTICLE_DESCRIPTION_MAX_LENGTH}

              className="min-h-[90px] resize-y"

            />

            <p className="text-right text-xs text-muted-foreground">

              {editArticleDescription.length}/{ARTICLE_DESCRIPTION_MAX_LENGTH}

            </p>

            <Textarea

              value={editArticleBody}

              onChange={(e) => setEditArticleBody(e.target.value)}

              className="min-h-[220px] resize-y"

            />

            <div className="flex flex-wrap gap-2">

              {CATEGORIES.map((c) => {

                const on = editArticleCats.includes(c);

                return (

                  <Button

                    key={c}

                    type="button"

                    size="sm"

                    variant={on ? "default" : "outline"}

                    className="rounded-full capitalize"

                    onClick={() =>

                      setEditArticleCats((prev) => (on ? prev.filter((x) => x !== c) : [...prev, c]))

                    }

                  >

                    {c}

                  </Button>

                );

              })}

            </div>

          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4">

            <Button variant="ghost" onClick={() => setArticleEditOpen(false)}>

              Cancel

            </Button>

            <Button

              onClick={() => updateArticleMut.mutate()}

              disabled={!editingArticleId || !editArticleTitle.trim() || updateArticleMut.isPending}

            >

              {updateArticleMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>



    </div>

  );

}



type PostCardProps = {

  post: CommunityPost;

  userId?: string;

  user?: any;

  account?: any;

  isAdmin: boolean;

  expanded: boolean;

  onToggleComments: () => void;

  comments: CommunityComment[];

  commentsLoading: boolean;

  commentText: string;

  commentImage: File | null;

  onCommentChange: (t: string) => void;

  onCommentImageChange: (f: File | null) => void;

  onSubmitComment: () => void;

  onDeletePost: () => void;

  onLike: () => void;

  onShare: (post: CommunityPost) => void;

  onEditPost: (postId: string, content: string) => void;

  onDeleteComment: (id: string) => void;

  onEditComment: (commentId: string, text: string) => void;

  onLikeComment: (id: string) => void;

  onReplyToComment: (parentCommentId: string, text: string, image?: File) => void;

  onToggleReplies: (commentId: string) => void;

  expandedReplies: Record<string, boolean>;

  replyDrafts: Record<string, string>;

  replyFiles: Record<string, File | null>;

  onReplyChange: (commentId: string, text: string) => void;

  onReplyImageChange: (commentId: string, file: File | null) => void;

  repliesQueries: Record<string, ReturnType<typeof useQuery>>;

  repostUsers: CommunityAuthor[];

};



type RepostWrapperProps = Omit<PostCardProps, "post"> & {

  repost: CommunityPost;

  originalPost: CommunityPost;

};



function RepostWrapper({

  repost,

  originalPost,

  userId,

  user,

  account,

  isAdmin,

  expanded,

  onToggleComments,

  comments,

  commentsLoading,

  commentText,

  commentImage,

  onCommentChange,

  onCommentImageChange,

  onSubmitComment,

  onDeletePost,

  onLike,

  onShare,

  onEditPost,

  onDeleteComment,

  onEditComment,

  onLikeComment,

  onReplyToComment,

  onToggleReplies,

  expandedReplies,

  replyDrafts,

  replyFiles,

  onReplyChange,

  onReplyImageChange,

  repliesQueries,

  repostUsers,

}: RepostWrapperProps) {

  return (

    <Card id={`post-${repost._id}`} className="overflow-hidden rounded-2xl border-border/70 shadow-sm">

      <div className="border-b bg-muted/30 px-4 py-3 text-sm text-muted-foreground">

        This post is not eligible to be boosted.

      </div>

      <div className="border-b px-4 py-3">

        <div className="flex items-center gap-2">

          <Avatar className="h-7 w-7">

            {authorPic(repost.author) && isDisplayableImageSrc(authorPic(repost.author)!) ? (

              <AvatarImage

                src={avatarImgSrcForDisplay(authorPic(repost.author)!)}

                className="object-cover"

                referrerPolicy="no-referrer"

              />

            ) : (

              <AvatarImage

                src={getDefaultAvatarUrl(authorName(repost.author))}

                className="object-cover"

                referrerPolicy="no-referrer"

              />

            )}

          </Avatar>

          <span className="text-sm font-medium">{authorName(repost.author)}</span>

          <span className="text-sm text-muted-foreground">reposted this</span>

        </div>

      </div>

      <div className="p-3">

        <PostCard

          post={originalPost}

          userId={userId}

          user={user}

          account={account}

          isAdmin={isAdmin}

          expanded={expanded}

          onToggleComments={onToggleComments}

          comments={comments}

          commentsLoading={commentsLoading}

          commentText={commentText}

          commentImage={commentImage}

          onCommentChange={onCommentChange}

          onCommentImageChange={onCommentImageChange}

          onSubmitComment={onSubmitComment}

          onDeletePost={onDeletePost}

          onLike={onLike}

          onShare={onShare}

          onEditPost={onEditPost}

          onDeleteComment={onDeleteComment}

          onEditComment={onEditComment}

          onLikeComment={onLikeComment}

          onReplyToComment={onReplyToComment}

          onToggleReplies={onToggleReplies}

          expandedReplies={expandedReplies}

          replyDrafts={replyDrafts}

          replyFiles={replyFiles}

          onReplyChange={onReplyChange}

          onReplyImageChange={onReplyImageChange}

          repliesQueries={repliesQueries}

          repostUsers={repostUsers}

        />

      </div>

    </Card>

  );

}



function PostCard({

  post,

  userId,

  user,

  account,

  isAdmin,

  expanded,

  onToggleComments,

  comments,

  commentsLoading,

  commentText,

  commentImage,

  onCommentChange,

  onCommentImageChange,

  onSubmitComment,

  onDeletePost,

  onLike,

  onShare,

  onEditPost,

  onDeleteComment,

  onEditComment,

  onLikeComment,

  onReplyToComment,

  onToggleReplies,

  expandedReplies,

  replyDrafts,

  replyFiles,

  onReplyChange,

  onReplyImageChange,

  repliesQueries,

  repostUsers,

}: PostCardProps) {

  const commentImageInputRef = useRef<HTMLInputElement>(null);

  const [commentImageErrors, setCommentImageErrors] = useState<Record<string, boolean>>({});

  const [repostsOpen, setRepostsOpen] = useState(false);

  const [repostUsersList, setRepostUsersList] = useState<CommunityAuthor[]>(repostUsers);

  const [repostsLoading, setRepostsLoading] = useState(false);

  const [editingPost, setEditingPost] = useState(false);

  const [editingPostText, setEditingPostText] = useState(clampPostContent(post.content ?? ""));

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const [editingCommentText, setEditingCommentText] = useState("");

  const authorId =

    typeof post.author === "object" && post.author ? post.author._id : undefined;

  const canDeletePost = Boolean(userId && authorId && userId === authorId) || isAdmin;



  const liked =

    Boolean(userId && post.likes?.some((id) => id.toString() === userId.toString())) ||

    false;

  const postImages = pickPostImages(post);
  const postVideos = pickPostVideos(post);

  const contentIsArabic = isMostlyArabic(post.content);



  useEffect(() => {

    setRepostUsersList(repostUsers);

  }, [repostUsers]);



  const openReposts = async () => {

    setRepostsOpen(true);

    if ((post.sharesCount ?? 0) <= 0) return;

    if (repostUsersList.length > 0) return;

    setRepostsLoading(true);

    try {

      const users = await fetchAllRepostUsersForPost(post._id);

      setRepostUsersList(users);

    } finally {

      setRepostsLoading(false);

    }

  };



  return (

    <Card id={`post-${post._id}`} className="rounded-2xl border-border/70 shadow-sm">

      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-3">

        <Avatar className="h-10 w-10">

          {authorPic(post.author) && isDisplayableImageSrc(authorPic(post.author)!) ? (

            <AvatarImage

              src={avatarImgSrcForDisplay(authorPic(post.author)!)}

              className="object-cover"

              referrerPolicy="no-referrer"

            />

          ) : (

            <AvatarImage

              src={getDefaultAvatarUrl(authorName(post.author))}

              className="object-cover"

              referrerPolicy="no-referrer"

            />

          )}

        </Avatar>

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <span className="font-medium">{authorName(post.author)}</span>

            {typeof post.author === "object" && post.author?.role ? (

              <Badge variant="outline" className="rounded-full text-[10px] uppercase">

                {post.author.role}

              </Badge>

            ) : null}

          </div>

          <p className="text-xs text-muted-foreground">

            {post.createdAt

              ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })

              : ""}

          </p>

        </div>

        {canDeletePost ? (

          <div className="flex items-center gap-1">

            <Button

              variant="ghost"

              size="sm"

              onClick={() => {

                setEditingPost(true);

                setEditingPostText(clampPostContent(post.content ?? ""));

              }}

            >

              Edit

            </Button>

            <Button variant="ghost" size="sm" className="text-destructive" onClick={onDeletePost}>

              Remove

            </Button>

          </div>

        ) : null}

      </CardHeader>

      <CardContent className="space-y-3 pb-2">

        {!editingPost ? <PostMediaGallery images={postImages} videos={postVideos} /> : null}

        {editingPost ? (

          <div className="space-y-2">

            <Textarea

              value={editingPostText}

              onChange={(e) => setEditingPostText(clampPostContent(e.target.value))}

              className="min-h-[90px]"

            />

            <p className="text-right text-xs text-muted-foreground">

              {getSubmittedPostContentLength(editingPostText)}/{POST_CONTENT_MAX_LENGTH}

            </p>

            <div className="flex items-center justify-end gap-2">

              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingPost(false)}>

                Cancel

              </Button>

              <Button

                type="button"

                size="sm"

                onClick={() => {

                  onEditPost(post._id, editingPostText);

                  setEditingPost(false);

                }}

                disabled={!editingPostText.trim()}

              >

                Save

              </Button>

            </div>

          </div>

        ) : post.content?.trim() ? (

          <p

            dir={contentIsArabic ? "rtl" : "ltr"}

            className={cn(

              "whitespace-pre-wrap text-sm leading-relaxed",

              contentIsArabic ? "text-right" : "text-left",

            )}

          >

            {post.content}

          </p>

        ) : null}

      </CardContent>

      <CardFooter className="block border-t px-4 pb-2 pt-2">

        <div className="mb-2 flex items-center justify-between px-1 text-xs text-muted-foreground">

          <span>{post.likesCount ?? 0} likes</span>

          <div className="flex items-center gap-1">

            <button

              type="button"

              className="underline-offset-2 hover:underline"

              onClick={onToggleComments}

            >

              {post.commentsCount ?? 0} comments

            </button>

            <span>·</span>

            <button

              type="button"

              className="underline-offset-2 hover:underline"

              onClick={() => void openReposts()}

            >

              {post.sharesCount ?? 0} reposts

            </button>

          </div>

        </div>

        <div className="grid grid-cols-3 gap-1 border-t pt-1.5">

          <Button

            type="button"

            variant="ghost"

            size="sm"

            className={cn(

              "h-9 rounded-md text-muted-foreground hover:bg-muted/60",

              liked && "text-rose-500",

            )}

            onClick={onLike}

          >

            <Heart className={cn("mr-1.5 h-4 w-4", liked && "fill-current")} />

            Like

          </Button>

          <Button

            type="button"

            variant="ghost"

            size="sm"

            className="h-9 rounded-md text-muted-foreground hover:bg-muted/60"

            onClick={onToggleComments}

          >

            <MessageCircle className="mr-1.5 h-4 w-4" />

            Comment

          </Button>

          <Button

            type="button"

            variant="ghost"

            size="sm"

            className="h-9 rounded-md text-muted-foreground hover:bg-muted/60"

            onClick={() => onShare(post)}

          >

            <Share2 className="mr-1.5 h-4 w-4" />

            Repost

          </Button>

        </div>

      </CardFooter>

      {expanded ? (

        <div className="border-t px-4 pb-4 pt-3">

          <div className="mb-3 flex items-start gap-2">

            <Avatar className="mt-0.5 h-8 w-8">

              {typeof post.author === "object" && authorPic(post.author) && isDisplayableImageSrc(authorPic(post.author)!) ? (

                <AvatarImage

                  src={avatarImgSrcForDisplay(authorPic(post.author)!)}

                  className="object-cover"

                  referrerPolicy="no-referrer"

                />

              ) : null}

              <AvatarFallback>{initials(authorName(post.author))}</AvatarFallback>

            </Avatar>

            <div className="w-full rounded-full border bg-background px-2.5 py-1.5">

              <div className="flex items-center gap-2">

                <input

                  placeholder="Add a comment..."

                  value={commentText}

                  onChange={(e) => onCommentChange(e.target.value)}

                  className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"

                />

                <Button

                  type="button"

                  variant="ghost"

                  size="icon"

                  className="h-7 w-7 rounded-full text-muted-foreground"

                  onClick={() => commentImageInputRef.current?.click()}

                >

                  <ImagePlus className="h-4 w-4" />

                </Button>

                <input

                  ref={commentImageInputRef}

                  type="file"

                  accept="image/*"

                  className="hidden"

                  aria-label="Attach comment photo"

                  title="Attach comment photo"

                  onChange={(e) => onCommentImageChange(e.target.files?.[0] ?? null)}

                />

                <Button type="button" size="sm" className="h-7 rounded-full px-3 text-xs" onClick={onSubmitComment}>

                  Reply

                </Button>

              </div>

            </div>

          </div>

          {commentsLoading ? (

            <Skeleton className="h-16 w-full rounded-xl" />

          ) : (

            <div className="space-y-3">

              {comments.map((c) => {

                const cid =

                  typeof c.author === "object" && c.author ? c.author._id : undefined;

                const canDel = Boolean(userId && cid && userId === cid) || isAdmin;

                const isLiked = Boolean(userId && c.likes?.some(id => id.toString() === userId.toString()));

                return (

                  <div

                    key={c._id}

                    className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm"

                  >

                    <div className="flex items-center justify-between gap-2">

                      <span className="font-medium">{authorName(c.author)}</span>

                      <div className="flex gap-1">

                        <Button

                          type="button"

                          variant="ghost"

                          size="sm"

                          className="h-7 px-2"

                          onClick={() => onLikeComment(c._id)}

                        >

                          <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />

                        </Button>

                        <Button

                          type="button"

                          variant="ghost"

                          size="sm"

                          className="h-7 px-2"

                          onClick={() => onToggleReplies(c._id)}

                        >

                          Reply

                        </Button>

                        {canDel ? (

                          <>

                            <Button

                              type="button"

                              variant="ghost"

                              size="sm"

                              className="h-7 px-2"

                              onClick={() => {

                                setEditingCommentId(c._id);

                                setEditingCommentText(c.text);

                              }}

                            >

                              Edit

                            </Button>

                            <Button

                              type="button"

                              variant="ghost"

                              size="sm"

                              className="h-7 px-2 text-destructive"

                              onClick={() => onDeleteComment(c._id)}

                            >

                              ×

                            </Button>

                          </>

                        ) : null}

                      </div>

                    </div>

                    {editingCommentId === c._id ? (

                      <div className="mt-2 space-y-2">

                        <Textarea

                          value={editingCommentText}

                          onChange={(e) => setEditingCommentText(e.target.value)}

                          className="min-h-[70px]"

                        />

                        <div className="flex items-center justify-end gap-2">

                          <Button

                            type="button"

                            variant="ghost"

                            size="sm"

                            onClick={() => setEditingCommentId(null)}

                          >

                            Cancel

                          </Button>

                          <Button

                            type="button"

                            size="sm"

                            onClick={() => {

                              onEditComment(c._id, editingCommentText);

                              setEditingCommentId(null);

                            }}

                            disabled={!editingCommentText.trim()}

                          >

                            Save

                          </Button>

                        </div>

                      </div>

                    ) : (

                      <p

                        dir={isMostlyArabic(c.text) ? "rtl" : "ltr"}

                        className={cn(

                          "mt-1 text-muted-foreground",

                          isMostlyArabic(c.text) ? "text-right" : "text-left",

                        )}

                      >

                        {c.text}

                      </p>

                    )}

                    {c.image ? (

                      <div className="mt-2 rounded-lg border border-border/70 bg-background/60 p-2">

                        {commentImageErrors[c._id] ? (

                          <div className="rounded-md border border-dashed border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">

                            Could not load image preview.

                            <a

                              href={c.image}

                              target="_blank"

                              rel="noreferrer"

                              className="ml-1 underline underline-offset-2"

                            >

                              Open image

                            </a>

                          </div>

                        ) : (

                          <img

                            src={postImgSrcForDisplay(c.image)}

                            alt="Comment attachment"

                            className="max-h-80 w-full object-contain"

                            loading="lazy"

                            referrerPolicy="no-referrer"

                            onError={() =>

                              setCommentImageErrors((prev) => ({

                                ...prev,

                                [c._id]: true,

                              }))

                            }

                          />

                        )}

                      </div>

                    ) : null}

                    {/* Reply Section */}
                    {expandedReplies[c._id] && (
                      <div className="mt-3 space-y-2 border-l-2 border-border/30 pl-4">
                        {/* Reply Input */}
                        <div className="flex items-start gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={currentUserPic(user, account)}
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <AvatarFallback className="text-xs">
                              {initials(authorName(user))}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Textarea
                              placeholder="Add a reply..."
                              value={replyDrafts[c._id] || ""}
                              onChange={(e) => onReplyChange(c._id, e.target.value)}
                              className="min-h-[60px] resize-none text-sm"
                              rows={2}
                            />
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2"
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e) => {
                                      const file = (e.target as HTMLInputElement).files?.[0];
                                      if (file) onReplyImageChange(c._id, file);
                                    };
                                    input.click();
                                  }}
                                >
                                  <ImagePlus className="h-3 w-3" />
                                </Button>
                                {replyFiles[c._id] && (
                                  <span className="text-xs text-muted-foreground">
                                    {replyFiles[c._id]?.name}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => onReplyChange(c._id, "")}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-6 px-3 text-xs"
                                  onClick={() => {
                                    const text = replyDrafts[c._id] || "";
                                    if (text.trim()) {
                                      onReplyToComment(c._id, text.trim(), replyFiles[c._id] || undefined);
                                    }
                                  }}
                                  disabled={!replyDrafts[c._id]?.trim()}
                                >
                                  Reply
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Display existing replies from nested comments */}
                        {c.replies && c.replies.length > 0 && (
                          <div className="space-y-2">
                            {c.replies.map((reply) => {
                              const replyLiked = Boolean(userId && reply.likes?.some(id => id.toString() === userId.toString()));
                              const replyAuthorId = typeof reply.author === "object" && reply.author ? reply.author._id : undefined;
                              const canDeleteReply = Boolean(userId && replyAuthorId && userId === replyAuthorId) || isAdmin;

                              return (
                                <div key={reply._id} className="flex items-start gap-2 rounded-lg bg-muted/10 p-2">
                                  <Avatar className="h-5 w-5">
                                    {authorPic(reply.author) && isDisplayableImageSrc(authorPic(reply.author)!) ? (
                                      <AvatarImage
                                        src={avatarImgSrcForDisplay(authorPic(reply.author)!)}
                                        className="object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <AvatarImage
                                        src={getDefaultAvatarUrl(authorName(reply.author))}
                                        className="object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    )}
                                    <AvatarFallback className="text-[10px]">
                                      {initials(authorName(reply.author))}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium">{authorName(reply.author)}</span>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 px-1"
                                          onClick={() => onLikeComment(reply._id)}
                                        >
                                          <Heart className={`h-3 w-3 ${replyLiked ? 'fill-red-500 text-red-500' : ''}`} />
                                        </Button>
                                        {canDeleteReply && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 px-1 text-destructive"
                                            onClick={() => onDeleteComment(reply._id)}
                                          >
                                            ×
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                    <p
                                      dir={isMostlyArabic(reply.text) ? "rtl" : "ltr"}
                                      className={cn(
                                        "text-xs text-muted-foreground mt-1",
                                        isMostlyArabic(reply.text) ? "text-right" : "text-left",
                                      )}
                                    >
                                      {reply.text}
                                    </p>
                                    {reply.image && (
                                      <div className="mt-1">
                                        <img
                                          src={reply.image}
                                          alt="Reply image"
                                          className="rounded border border-border/50 max-h-20 w-auto object-cover"
                                          loading="lazy"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                );

              })}

            </div>

          )}

          {commentImage ? (

            <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">

              Attached image: <span className="font-medium">{commentImage.name}</span>

            </div>

          ) : null}

        </div>

      ) : null}

      <Dialog open={repostsOpen} onOpenChange={setRepostsOpen}>

        <DialogContent className="max-w-md">

          <DialogHeader>

            <DialogTitle>People who reposted</DialogTitle>

          </DialogHeader>

          {repostsLoading ? (

            <p className="text-sm text-muted-foreground">Loading repost records...</p>

          ) : repostUsersList.length === 0 ? (

            <p className="text-sm text-muted-foreground">

              No repost records found in available API pages.

            </p>

          ) : (

            <div className="space-y-2">

              {repostUsersList.map((u, i) => (

                <div

                  key={`${u._id ?? u.email ?? u.name ?? "user"}-${i}`}

                  className="flex items-center gap-2 rounded-lg border px-3 py-2"

                >

                  <Avatar className="h-8 w-8">

                    {(u.avatar || u.profilePicture) && isDisplayableImageSrc(u.avatar || u.profilePicture || "") ? (

                      <AvatarImage

                        src={avatarImgSrcForDisplay(u.avatar || u.profilePicture || "")}

                        className="object-cover"

                        referrerPolicy="no-referrer"

                      />

                    ) : (

                      <AvatarImage

                        src={getDefaultAvatarUrl(u.name || u.email || "Member")}

                        className="object-cover"

                        referrerPolicy="no-referrer"

                      />

                    )}

                  </Avatar>

                  <div className="text-sm font-medium">{u.name || u.email || "Member"}</div>

                </div>

              ))}

            </div>

          )}

        </DialogContent>

      </Dialog>

    </Card>

  );

}