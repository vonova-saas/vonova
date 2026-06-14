"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Lock, Send, X, Globe2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePost } from "@/hooks/app/community/use-social";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";

const MAX_CONTENT = 4000;
const MAX_IMAGES = 4;
const ACCEPT_TYPES = "image/png,image/jpeg,image/webp,image/gif";

type Visibility = "PUBLIC" | "FOLLOWERS";

export function PostComposer() {
  const auth = useAuthContextOptional();
  const me = auth?.user;
  const create = useCreatePost();

  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!auth?.isAuthenticated) return null;

  const fallback = (me?.name ?? me?.email ?? "?").charAt(0).toUpperCase();
  // Auth payload typing on the client is loose because the user object is
  // re-shared across LMS/community modules. Cast through unknown so we can
  // read optional community-specific fields without widening the public type.
  const avatarUrl = (me as unknown as { profilePictureUrl?: string } | undefined)
    ?.profilePictureUrl;

  const trimmed = content.trim();
  const canPost = trimmed.length > 0 && trimmed.length <= MAX_CONTENT;

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.warning(`You can attach up to ${MAX_IMAGES} images`);
      return;
    }
    setImages((prev) => [...prev, ...incoming.slice(0, room)]);
  }

  function removeImageAt(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  function reset() {
    setContent("");
    setImages([]);
    setVisibility("PUBLIC");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function submit() {
    if (!canPost || create.isPending) return;
    create.mutate(
      { content: trimmed, visibility, images: images.length ? images : undefined },
      { onSuccess: reset },
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-3 p-4">
        <div className="flex gap-3">
          <Avatar className="mt-1 h-10 w-10 shrink-0">
            <AvatarImage src={avatarUrl} alt={me?.name ?? "You"} />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <Textarea
              placeholder="Share an update with the community…"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
              className="min-h-[80px] resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
              }}
            />
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {images.map((file, i) => {
                  const url = URL.createObjectURL(file);
                  return (
                    <div
                      key={`${file.name}-${i}`}
                      className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                    >
                      {/* Object URLs are local; <img> avoids next/image domain config. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={file.name}
                        className="h-full w-full object-cover"
                        onLoad={() => URL.revokeObjectURL(url)}
                      />
                      <button
                        type="button"
                        onClick={() => removeImageAt(i)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= MAX_IMAGES}
            >
              <ImagePlus className="h-4 w-4" />
              <span className="hidden sm:inline">Image</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_TYPES}
              multiple
              className="hidden"
              aria-label="Attach images to post"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Select
              value={visibility}
              onValueChange={(v) => setVisibility(v as Visibility)}
            >
              <SelectTrigger className="h-8 w-[140px] gap-1 rounded-full px-3 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">
                  <span className="flex items-center gap-2 text-xs">
                    <Globe2 className="h-3.5 w-3.5" /> Public
                  </span>
                </SelectItem>
                <SelectItem value="FOLLOWERS">
                  <span className="flex items-center gap-2 text-xs">
                    <Lock className="h-3.5 w-3.5" /> Followers
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs ${
                trimmed.length > MAX_CONTENT - 200
                  ? "text-amber-500"
                  : "text-muted-foreground"
              }`}
            >
              {trimmed.length}/{MAX_CONTENT}
            </span>
            <Button
              size="sm"
              className="gap-2"
              onClick={submit}
              disabled={!canPost || create.isPending}
            >
              {create.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
