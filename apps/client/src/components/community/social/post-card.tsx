"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Globe2,
  Lock,
  Loader2,
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
  ImagePlus,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchPostById } from "@/services/app/community/posts.api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { ReportContentDialog } from "@/components/community/moderation/report-content-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FollowButton } from "@/components/community/social/follow-button";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";
import {
  useCreatePostComment,
  useCreateReply,
  usePostComments,
  usePostLikers,
  useSharePost,
  useToggleCommentLike,
  useTogglePostLike,
  useCommentLikers,
  useUpdatePost,
  useDeletePost,
} from "@/hooks/app/community/use-social";
import type {
  CommunityFeedItem,
  CommunityPostVisibility,
  CommunityProfileSummary,
} from "@/types/api/app/community/social.types";
import type { CommunityComment } from "@/services/app/community/posts.api";
import { CommunityMediaLightbox } from "@/components/community/social/community-media-lightbox";
import { PresignedMediaImage } from "@/components/shared/presigned-media-image";
import { communityAvatarDisplayUrl } from "@/lib/media/community-avatar-display-url";

function authorOf(post: CommunityFeedItem): CommunityProfileSummary | null {
  if (post.author && typeof post.author === "object") {
    return post.author as CommunityProfileSummary;
  }
  return null;
}

function pickAuthorAvatarUrl(
  a: CommunityProfileSummary | null | undefined,
): string | undefined {
  if (!a) return undefined;
  const x = a as CommunityProfileSummary & {
    profilePicture?: string | null;
    avatar?: string | null;
    avatarUrl?: string | null;
  };
  const raw =
    x.profilePictureUrl ||
    (typeof x.profilePicture === "string" ? x.profilePicture : undefined) ||
    (typeof x.avatar === "string" ? x.avatar : undefined) ||
    (typeof x.avatarUrl === "string" ? x.avatarUrl : undefined) ||
    undefined;
  return communityAvatarDisplayUrl(raw);
}

function profileHref(author: CommunityProfileSummary | null): string {
  if (author?.username) return `/community/profile/${author.username}`;
  if (author?._id) return `/community/profile/${author._id}`;
  return "#";
}

function commentAuthor(
  c: CommunityComment,
): CommunityProfileSummary | null {
  const a = c.author;
  if (a && typeof a === "object" && "_id" in a) {
    return a as CommunityProfileSummary;
  }
  return null;
}

function mediaUrls(post: CommunityFeedItem): string[] {
  return Array.from(
    new Set(
      [
        ...(post.images?.filter(Boolean) ?? []),
        ...(post.image ? [post.image] : []),
      ].filter(Boolean),
    ),
  );
}

function PostMediaImage({
  postId,
  src,
  index,
  className,
}: {
  postId: string;
  src: string;
  index: number;
  className?: string;
}) {
  return (
    <PresignedMediaImage
      src={src}
      fill
      sizes="(max-width: 768px) 100vw, 600px"
      className={cn("object-cover", className)}
      alt="Post media"
      onRefreshSrc={async () => {
        const fresh = await fetchPostById(postId);
        const urls = mediaUrls(fresh);
        return urls[index] ?? null;
      }}
    />
  );
}

/** Normalize hashtag chips (avoids "hashtag#foo" doubling). */
function displayHashtag(raw: string): string {
  let t = String(raw).trim();
  t = t.replace(/^hashtag#?/i, "");
  t = t.replace(/^#+/, "");
  return t;
}

function SharedPostEmbed({
  inner,
  onOpenGallery,
}: {
  inner: CommunityFeedItem;
  onOpenGallery: (urls: string[], index: number, sourcePostId: string) => void;
}) {
  const orig = authorOf(inner);
  const urls = mediaUrls(inner);
  return (
    <div className="rounded-xl border border-border/80 bg-muted/40 p-3 md:p-4">
      <div className="flex items-start gap-2">
        <Link href={profileHref(orig)} className="shrink-0">
          <Avatar className="h-8 w-8 md:h-9 md:w-9">
            <AvatarImage
              src={pickAuthorAvatarUrl(orig)}
              alt={orig?.name}
            />
            <AvatarFallback>
              {(orig?.name ?? "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 text-xs md:text-sm">
            <Link
              href={profileHref(orig)}
              className="font-semibold hover:underline"
            >
              {orig?.name ?? "Original poster"}
            </Link>
            {orig?.username ? (
              <span className="text-muted-foreground">@{orig.username}</span>
            ) : null}
          </div>
          {inner.content ? (
            <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground md:text-sm">
              {inner.content}
            </p>
          ) : null}
        </div>
      </div>
      {urls.length > 0 ? (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {urls.slice(0, 3).map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Open original post image ${i + 1} of ${urls.length}`}
              className="relative aspect-square overflow-hidden rounded-md bg-muted ring-offset-2 transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              onClick={() => onOpenGallery(urls, i, inner._id)}
            >
              <PostMediaImage
                postId={inner._id}
                src={src}
                index={i}
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PostReportMenu({ post }: { post: CommunityFeedItem }) {
  return (
    <ReportContentDialog
      targetType={post.sharedPost ? "REPOST" : "POST"}
      targetId={post._id}
      groupId={(post as { groupId?: string }).groupId}
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          aria-label="Report post"
        >
          <Flag className="h-4 w-4" />
        </Button>
      }
    />
  );
}

function PostOwnerActions({ post }: { post: CommunityFeedItem }) {
  const auth = useAuthContextOptional();
  const author = authorOf(post);
  const me = auth?.user?._id;
  const isOwner =
    !!me && !!author?._id && String(author._id) === String(me);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draft, setDraft] = useState(post.content ?? "");
  const [visibility, setVisibility] = useState<CommunityPostVisibility>(
    post.visibility ?? "PUBLIC",
  );
  const [extraImages, setExtraImages] = useState<File[]>([]);
  const imagePickRef = useRef<HTMLInputElement>(null);

  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();

  useEffect(() => {
    if (editOpen) {
      setDraft(post.content ?? "");
      setVisibility(post.visibility ?? "PUBLIC");
      setExtraImages([]);
    }
  }, [editOpen, post.content, post.visibility]);

  if (!isOwner) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            aria-label="Post actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            className="gap-2"
            onSelect={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Edit post
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 text-destructive focus:text-destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete post
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {post.sharedPost ? "Edit your repost" : "Edit post"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor={`post-edit-${post._id}`}>Content</Label>
              <textarea
                id={`post-edit-${post._id}`}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="What do you want to say?"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`post-vis-${post._id}`}>Who can see this</Label>
              <Select
                value={visibility}
                onValueChange={(v) =>
                  setVisibility(v as CommunityPostVisibility)
                }
              >
                <SelectTrigger id={`post-vis-${post._id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Anyone</SelectItem>
                  <SelectItem value="FOLLOWERS">Followers only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Add images</Label>
              <p className="text-xs text-muted-foreground">
                New photos are appended when you save. Only you can add images to
                your post.
              </p>
              <input
                ref={imagePickRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                aria-label="Choose images to add"
                onChange={(e) => {
                  const list = e.target.files;
                  setExtraImages(list ? Array.from(list) : []);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => imagePickRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
                Choose files
              </Button>
              {extraImages.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {extraImages.length} image
                  {extraImages.length === 1 ? "" : "s"} selected
                </p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                updatePost.isPending || draft.trim().length === 0
              }
              onClick={() => {
                updatePost.mutate(
                  {
                    postId: post._id,
                    content: draft.trim(),
                    visibility,
                    images:
                      extraImages.length > 0 ? extraImages : undefined,
                  },
                  {
                    onSuccess: () => {
                      setEditOpen(false);
                      setExtraImages([]);
                    },
                  },
                );
              }}
            >
              {updatePost.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Comments and likes will be removed with the
              post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deletePost.isPending}
              onClick={() =>
                deletePost.mutate(post._id, {
                  onSuccess: () => setDeleteOpen(false),
                })
              }
            >
              {deletePost.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function PostCard({ post }: { post: CommunityFeedItem }) {
  const auth = useAuthContextOptional();
  const author = authorOf(post);
  const imageUrls = mediaUrls(post);
  const shared = post.sharedPost;
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likersOpen, setLikersOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [gallery, setGallery] = useState<{
    urls: string[];
    index: number;
    /** Post id used to refetch fresh media (reposts use the inner/original id from the gallery opener). */
    refreshPostId: string;
  } | null>(null);

  const openGallery = useCallback(
    (urls: string[], index: number, sourcePostId?: string) => {
      const u = urls.filter(Boolean);
      if (!u.length) return;
      setGallery({
        urls: u,
        index,
        refreshPostId: sourcePostId ?? post._id,
      });
    },
    [post._id],
  );

  const likePost = useTogglePostLike();
  const sharePost = useSharePost();
  const commentsQ = usePostComments(commentsOpen ? post._id : null);
  const createComment = useCreatePostComment(post._id);
  const createReply = useCreateReply(post._id);
  const likersQ = usePostLikers(post._id, likersOpen);

  const likedByMe = useMemo(() => {
    const me = auth?.user?._id;
    if (!me || !Array.isArray(post.likes)) return false;
    return post.likes.some((id) => String(id) === String(me));
  }, [auth?.user?._id, post.likes]);

  /** Repost/share should target the root post id, not the repost wrapper id. */
  const postIdToShare = useMemo(() => {
    const s = post.sharedPost;
    if (s && typeof s === "object" && "_id" in s && (s as CommunityFeedItem)._id) {
      return String((s as CommunityFeedItem)._id);
    }
    return post._id;
  }, [post.sharedPost, post._id]);

  const displaySharesCount = useMemo(() => {
    const s = post.sharedPost;
    if (s && typeof s === "object" && "_id" in s) {
      return (s as CommunityFeedItem).sharesCount ?? post.sharesCount ?? 0;
    }
    return post.sharesCount ?? 0;
  }, [post.sharedPost, post.sharesCount]);

  return (
    <article className="rounded-[1.25rem] border border-border/80 bg-card/95 p-4 shadow-md transition hover:border-violet-500/25 hover:shadow-lg md:p-6">
      <div className="flex items-start gap-3">
        <Link href={profileHref(author)} className="shrink-0">
          <Avatar className="h-12 w-12 md:h-14 md:w-14">
            <AvatarImage
              src={pickAuthorAvatarUrl(author)}
              alt={author?.name}
            />
            <AvatarFallback>
              {(author?.name ?? "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Link
              href={profileHref(author)}
              className="truncate text-base font-semibold hover:underline md:text-lg"
            >
              {author?.name ?? "Anonymous"}
            </Link>
            {shared ? (
              <Badge variant="outline" className="h-5 text-[10px]">
                Repost
              </Badge>
            ) : null}
            {author?.isVerifiedInstructor && (
              <Badge
                variant="secondary"
                className="h-5 rounded-full bg-violet-100 px-2 text-[10px] text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
              >
                Instructor
              </Badge>
            )}
            {author?.headline && (
              <span className="truncate text-xs text-muted-foreground">
                · {author.headline}
              </span>
            )}
          </div>
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <span>
              {post.createdAt
                ? formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                  })
                : "just now"}
            </span>
            <span>·</span>
            {post.visibility === "FOLLOWERS" ? (
              <span className="inline-flex items-center gap-1">
                <Lock className="h-3 w-3" /> Followers
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Globe2 className="h-3 w-3" /> Anyone
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <PostReportMenu post={post} />
          <PostOwnerActions post={post} />
          {author?._id ? <FollowButton userId={author._id} /> : null}
        </div>
      </div>

      {post.content ? (
        <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed md:text-[17px]">
          {post.content}
        </p>
      ) : null}

      {shared && typeof shared === "object" ? (
        <div className="mt-4">
          <SharedPostEmbed inner={shared} onOpenGallery={openGallery} />
        </div>
      ) : null}

      {(post.hashtags?.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.hashtags!.map((h, i) => {
            const tag = displayHashtag(h);
            return (
              <span
                key={`${post._id}-tag-${i}`}
                className="rounded-full bg-violet-500/15 px-3 py-1 text-sm font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
              >
                #{tag}
              </span>
            );
          })}
        </div>
      )}

      {imageUrls.length > 0 && !shared ? (
        <div
          className={cn(
            "mt-4 grid gap-2 overflow-hidden rounded-2xl md:gap-2.5",
            imageUrls.length === 1
              ? "grid-cols-1"
              : imageUrls.length === 2
                ? "grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3",
          )}
        >
          {imageUrls.slice(0, 4).map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Open image ${i + 1} of ${imageUrls.length}`}
              className="relative aspect-video w-full overflow-hidden bg-muted ring-offset-2 transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              onClick={() => openGallery(imageUrls, i)}
            >
              <PostMediaImage postId={post._id} src={src} index={i} />
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-1 text-muted-foreground">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1.5",
            likedByMe && "text-rose-600 dark:text-rose-400",
          )}
          disabled={!auth?.isAuthenticated || likePost.isPending}
          onClick={() => {
            if (!auth?.isAuthenticated) {
              toast.message("Sign in to like posts");
              return;
            }
            likePost.mutate(post._id);
          }}
        >
          {likePost.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={cn("h-4 w-4", likedByMe && "fill-current")} />
          )}
          <span className="text-xs">{post.likesCount ?? 0}</span>
        </Button>

        <Popover open={likersOpen} onOpenChange={setLikersOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1 px-1.5"
              aria-label="Who liked this post"
            >
              <Users className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <div className="border-b px-3 py-2 text-xs font-medium">
              People who liked this
            </div>
            <ScrollArea className="max-h-56">
              <ul className="divide-y p-1">
                {(likersQ.data?.items ?? []).map((u) => (
                  <li key={String(u._id)} className="flex items-center gap-2 py-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={u.profilePictureUrl} alt={u.name} />
                      <AvatarFallback>
                        {(u.name ?? "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 text-xs">
                      <p className="truncate font-medium">{u.name}</p>
                      {u.username ? (
                        <p className="truncate text-muted-foreground">
                          @{u.username}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
                {likersQ.isLoading ? (
                  <li className="flex justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </li>
                ) : null}
                {!likersQ.isLoading &&
                (likersQ.data?.items?.length ?? 0) === 0 ? (
                  <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                    No likes yet.
                  </li>
                ) : null}
              </ul>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => setCommentsOpen(true)}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs">{post.commentsCount ?? 0}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          disabled={!auth?.isAuthenticated || sharePost.isPending}
          onClick={() => {
            if (!auth?.isAuthenticated) {
              toast.message("Sign in to repost");
              return;
            }
            const c = window.prompt("Add a short note (optional):") ?? "";
            sharePost.mutate({
              postId: postIdToShare,
              comment: c.trim() || undefined,
            });
          }}
        >
          {sharePost.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Repeat2 className="h-4 w-4" />
          )}
          <span className="text-xs">{displaySharesCount}</span>
        </Button>
      </div>

      <Sheet open={commentsOpen} onOpenChange={setCommentsOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Comments</SheetTitle>
          </SheetHeader>
          <div className="mt-3 flex gap-2">
            <Input
              placeholder={
                auth?.isAuthenticated
                  ? "Write a comment…"
                  : "Sign in to comment"
              }
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              disabled={!auth?.isAuthenticated || createComment.isPending}
            />
            <Button
              size="sm"
              disabled={
                !auth?.isAuthenticated ||
                !commentDraft.trim() ||
                createComment.isPending
              }
              onClick={() => {
                const t = commentDraft.trim();
                if (!t) return;
                createComment.mutate(t, {
                  onSuccess: () => setCommentDraft(""),
                });
              }}
            >
              {createComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Post"
              )}
            </Button>
          </div>
          <ScrollArea className="mt-4 flex-1 pr-3">
            {commentsQ.isLoading ? (
              <div className="flex justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <ul className="space-y-4">
                {(commentsQ.data?.comments ?? []).map((c) => (
                  <CommentThread
                    key={c._id}
                    c={c}
                    replyTo={replyTo}
                    setReplyTo={setReplyTo}
                    replyDraft={replyDraft}
                    setReplyDraft={setReplyDraft}
                    createReply={createReply}
                    auth={auth}
                  />
                ))}
                {(commentsQ.data?.comments?.length ?? 0) === 0 &&
                !commentsQ.isLoading ? (
                  <li className="py-8 text-center text-sm text-muted-foreground">
                    No comments yet. Be the first.
                  </li>
                ) : null}
              </ul>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <CommunityMediaLightbox
        open={gallery !== null}
        onOpenChange={(o) => {
          if (!o) setGallery(null);
        }}
        urls={gallery?.urls ?? []}
        initialIndex={gallery?.index ?? 0}
        onRefreshAtIndex={async (i) => {
          const id = gallery?.refreshPostId ?? post._id;
          const fresh = await fetchPostById(id);
          return mediaUrls(fresh)[i] ?? null;
        }}
      />
    </article>
  );
}

function CommentThread({
  c,
  replyTo,
  setReplyTo,
  replyDraft,
  setReplyDraft,
  createReply,
  auth,
}: {
  c: CommunityComment;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  replyDraft: string;
  setReplyDraft: (s: string) => void;
  createReply: ReturnType<typeof useCreateReply>;
  auth: ReturnType<typeof useAuthContextOptional>;
}) {
  const [clOpen, setClOpen] = useState(false);
  const ca = commentAuthor(c);
  const toggleCL = useToggleCommentLike();
  const likersQ = useCommentLikers(c._id, clOpen);

  return (
    <li className="rounded-lg border bg-muted/30 p-3">
      <div className="flex gap-2">
        <Link href={profileHref(ca)} className="shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={ca?.profilePictureUrl} alt={ca?.name} />
            <AvatarFallback>
              {(ca?.name ?? "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2 text-xs">
            <Link href={profileHref(ca)} className="font-semibold hover:underline">
              {ca?.name ?? "User"}
            </Link>
            {c.createdAt ? (
              <span className="text-muted-foreground">
                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
              </span>
            ) : null}
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm">{c.text}</p>
          {c.image ? (
            <div className="relative mt-2 aspect-video w-full max-w-xs overflow-hidden rounded-md bg-muted">
              <Image
                src={c.image}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              disabled={!auth?.isAuthenticated || toggleCL.isPending}
              onClick={() => {
                if (!auth?.isAuthenticated) {
                  toast.message("Sign in to like comments");
                  return;
                }
                toggleCL.mutate(c._id);
              }}
            >
              <Heart className="h-3.5 w-3.5" />
              {c.likesCount ?? 0}
            </Button>
            <Popover open={clOpen} onOpenChange={setClOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-1.5 text-xs"
                  aria-label="Who liked this comment"
                >
                  <Users className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <div className="border-b px-3 py-2 text-xs font-medium">
                  Comment likes
                </div>
                <ScrollArea className="max-h-48">
                  <ul className="divide-y p-1">
                    {(likersQ.data?.items ?? []).map((u) => (
                      <li
                        key={String(u._id)}
                        className="flex items-center gap-2 py-2 text-xs"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={u.profilePictureUrl} />
                          <AvatarFallback>
                            {(u.name ?? "?").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate font-medium">{u.name}</span>
                      </li>
                    ))}
                    {likersQ.isLoading ? (
                      <li className="flex justify-center py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </li>
                    ) : null}
                    {!likersQ.isLoading &&
                    (likersQ.data?.items?.length ?? 0) === 0 ? (
                      <li className="px-3 py-3 text-center text-xs text-muted-foreground">
                        No likes yet.
                      </li>
                    ) : null}
                  </ul>
                </ScrollArea>
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={!auth?.isAuthenticated}
              onClick={() =>
                setReplyTo(replyTo === c._id ? null : c._id)
              }
            >
              Reply
            </Button>
          </div>
          {replyTo === c._id ? (
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Your reply…"
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                disabled={createReply.isPending}
              />
              <Button
                size="sm"
                disabled={!replyDraft.trim() || createReply.isPending}
                onClick={() => {
                  const t = replyDraft.trim();
                  if (!t) return;
                  createReply.mutate(
                    { parentCommentId: c._id, text: t },
                    {
                      onSuccess: () => {
                        setReplyDraft("");
                        setReplyTo(null);
                      },
                    },
                  );
                }}
              >
                {createReply.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          ) : null}
          {(c.replies?.length ?? 0) > 0 ? (
            <ul className="mt-3 space-y-2 border-l pl-3">
              {c.replies!.map((r) => {
                const ra = commentAuthor(r);
                return (
                  <li key={r._id} className="text-xs">
                    <div className="flex gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={ra?.profilePictureUrl} />
                        <AvatarFallback>
                          {(ra?.name ?? "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-semibold">{ra?.name}</span>
                        <p className="mt-0.5 whitespace-pre-wrap text-muted-foreground">
                          {r.text}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </li>
  );
}
