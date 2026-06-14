"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Loader2,
  MoreVertical,
  Paperclip,
  Pin,
  Reply,
  Search,
  Send,
  Smile,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageAttachments } from "@/components/community/messages/message-attachments";
import { VoiceRecorder } from "@/components/community/messages/voice-recorder";
import {
  useDeleteGroupChatMessage,
  useGroupChatMessages,
  useMarkGroupChatSeen,
  useSendGroupChatMessage,
  useToggleGroupChatReaction,
  useUpdateGroupChatMessage,
  socialKeys,
} from "@/hooks/app/community/use-social";
import {
  SOCKET_EVENTS,
  useCommunitySocket,
  useSocketEvent,
} from "@/providers/community-socket-provider";
import {
  pinGroupChatMessage,
  presignGroupUpload,
  searchGroupChatMessages,
  unpinGroupChatMessage,
  uploadToPresignedUrl,
  type CommunityAttachment,
} from "@/services/app/community/social.api";
import {
  resolveFileMessageUploadMeta,
  resolveVoiceMessageUploadMeta,
} from "@/lib/community/message-upload-meta";
import { cn } from "@/lib/utils";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";
import { setCommunityPresenceView } from "@/lib/community/notification-presence";
import type {
  CommunityProfileSummary,
  GroupChatMessage,
} from "@/types/api/app/community/social.types";
import { toast } from "sonner";

const QUICK_EMOJI = ["👍", "❤️", "😂", "🎉", "🔥"] as const;

function senderIdOf(m: GroupChatMessage): string {
  const raw = m.senderId;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object" && "_id" in raw) {
    return String((raw as { _id: string })._id);
  }
  return "";
}

function senderProfile(m: GroupChatMessage): CommunityProfileSummary | null {
  const raw = m.senderId;
  if (raw && typeof raw === "object" && "_id" in raw) {
    return raw as CommunityProfileSummary;
  }
  return null;
}

function replyPreview(m: GroupChatMessage): GroupChatMessage | null {
  const r = m.replyTo;
  if (!r) return null;
  if (typeof r === "object") return r as GroupChatMessage;
  return null;
}

type Props = {
  groupId: string;
  canPost: boolean;
  canModerate?: boolean;
};

export function GroupCourseChat({
  groupId,
  canPost,
  canModerate = false,
}: Props) {
  const auth = useAuthContextOptional();
  const meId = auth?.user?._id;
  const q = useGroupChatMessages(groupId);
  const qc = useQueryClient();
  const lastAttachInvalidate = useRef(0);
  const onAttachmentSignedMediaError = useCallback(() => {
    const now = Date.now();
    if (now - lastAttachInvalidate.current < 90_000) return;
    lastAttachInvalidate.current = now;
    void qc.invalidateQueries({
      queryKey: [...socialKeys.groupChat(groupId), "infinite"],
    });
  }, [qc, groupId]);
  const send = useSendGroupChatMessage(groupId);
  const updateMsg = useUpdateGroupChatMessage(groupId);
  const deleteMsg = useDeleteGroupChatMessage(groupId);
  const toggleReaction = useToggleGroupChatReaction(groupId);
  const markSeen = useMarkGroupChatSeen(groupId);
  const socket = useCommunitySocket();

  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<GroupChatMessage | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [peerTyping, setPeerTyping] = useState<{ name?: string } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchHits, setSearchHits] = useState<GroupChatMessage[]>([]);
  const [searching, setSearching] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sendLock = useRef(false);
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const pages = q.data?.pages ?? [];
  const messages = useMemo(() => {
    if (!pages.length) return [];
    return [...pages].reverse().flatMap((p) => p.items);
  }, [pages]);
  const pinned = pages[0]?.pinnedMessages ?? [];
  const hasOlder = !!q.hasNextPage;

  useEffect(() => {
    if (!groupId || !socket.isConnected) return;
    socket.joinGroup(groupId);
  }, [groupId, socket]);

  useEffect(() => {
    if (!groupId) return;
    setCommunityPresenceView({ kind: "group", id: groupId });
    return () => setCommunityPresenceView(null);
  }, [groupId]);

  const scrollBottom = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (!q.isFetchingNextPage) scrollBottom();
  }, [messages.length, scrollBottom, q.isFetchingNextPage]);

  useEffect(() => {
    if (!messages.length || !canPost) return;
    const last = messages[messages.length - 1];
    if (last?._id) markSeen.mutate(String(last._id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, groupId, canPost]);

  useSocketEvent<{ groupId: string }>(
    SOCKET_EVENTS.GROUP_MESSAGE_NEW,
    (p) => {
      if (p?.groupId === groupId) scrollBottom();
    },
    [groupId, scrollBottom],
  );

  useSocketEvent<{
    groupId: string;
    userId: string;
    name?: string;
    isTyping: boolean;
  }>(
    SOCKET_EVENTS.GROUP_TYPING,
    (p) => {
      if (p?.groupId !== groupId || !p.userId || p.userId === meId) return;
      if (!p.isTyping) {
        setPeerTyping(null);
        return;
      }
      setPeerTyping({ name: p.name });
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      typingClearRef.current = setTimeout(() => setPeerTyping(null), 2500);
    },
    [groupId, meId],
  );

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!groupId || !socket.isConnected) return;
      socket.emit(SOCKET_EVENTS.GROUP_TYPING, { groupId, isTyping });
    },
    [groupId, socket],
  );

  const doSend = async (payload: {
    content?: string;
    attachmentsMeta?: CommunityAttachment[];
    type?: "text" | "image" | "file" | "audio";
    replyToId?: string | null;
  }) => {
    if (sendLock.current || send.isPending) return;
    sendLock.current = true;
    try {
      await send.mutateAsync({
        content: payload.content ?? "",
        attachmentsMeta: payload.attachmentsMeta,
        type: payload.type,
        replyTo: payload.replyToId ?? null,
      });
      setText("");
      setReplyTo(null);
    } finally {
      sendLock.current = false;
    }
  };

  const onSendText = () => {
    const v = text.trim();
    if (!v) return;
    emitTyping(false);
    void doSend({ content: v, type: "text", replyToId: replyTo?._id });
  };

  const onTextChange = (value: string) => {
    setText(value);
    if (!canPost) return;
    emitTyping(true);
    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    typingStopRef.current = setTimeout(() => emitTyping(false), 1200);
  };

  const loadOlder = () => {
    const el = scrollerRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    void q.fetchNextPage().then(() => {
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    });
  };

  const runSearch = async () => {
    const qstr = searchQ.trim();
    if (!qstr) {
      setSearchHits([]);
      return;
    }
    setSearching(true);
    try {
      const res = await searchGroupChatMessages(groupId, { q: qstr, limit: 30 });
      setSearchHits(res.items);
    } finally {
      setSearching(false);
    }
  };

  const scrollToMessage = (id: string) => {
    messageRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const onFilePick = async (file: File) => {
    if (!file || uploading) return;
    setUploading(true);
    setUploadPct(0);
    try {
      const meta = resolveFileMessageUploadMeta(file);
      const presigned = await presignGroupUpload(groupId, {
        originalName: file.name,
        contentType: meta.contentType,
        kind: meta.kind,
      });
      await uploadToPresignedUrl(
        presigned,
        file,
        presigned.contentType ?? file.type,
        (pct) => setUploadPct(pct),
      );
      await doSend({
        content: "",
        attachmentsMeta: [
          {
            type: meta.kind,
            url: presigned.key,
            key: presigned.key,
            mimeType: file.type || null,
            size: file.size,
            name: file.name,
          },
        ],
        type: meta.kind === "IMAGE" ? "image" : "file",
        replyToId: replyTo?._id,
      });
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  };

  const onVoice = async (blob: Blob, durationSec: number) => {
    if (uploading) return;
    setUploading(true);
    try {
      const meta = resolveVoiceMessageUploadMeta({
        mimeType: blob.type || "audio/webm",
      });
      const presigned = await presignGroupUpload(groupId, {
        originalName: `voice.${meta.filenameExt}`,
        contentType: meta.contentType,
        kind: "VOICE",
      });
      await uploadToPresignedUrl(presigned, blob, meta.contentType);
      await doSend({
        content: "",
        attachmentsMeta: [
          {
            type: "VOICE",
            url: presigned.key,
            key: presigned.key,
            mimeType: meta.contentType,
            duration: durationSec,
          },
        ],
        type: "audio",
        replyToId: replyTo?._id,
      });
    } finally {
      setUploading(false);
    }
  };

  const renderMessage = (m: GroupChatMessage) => {
    const mine = Boolean(meId && senderIdOf(m) === meId);
    const profile = senderProfile(m);
    const body = (m.text ?? "").trim();
    const reply = replyPreview(m);
    const isEditing = editingId === m._id;

    return (
      <div
        key={m._id}
        ref={(el) => {
          messageRefs.current[m._id] = el;
        }}
        className={cn("group flex gap-2", mine ? "flex-row-reverse" : "flex-row")}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={profile?.profilePictureUrl} />
          <AvatarFallback>
            {(profile?.name ?? "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            "max-w-[min(85%,420px)] rounded-2xl px-3 py-2 text-sm",
            mine ? "bg-primary text-primary-foreground" : "bg-muted",
          )}
        >
          {!mine && profile?.name && (
            <p className="mb-0.5 text-xs font-medium opacity-80">{profile.name}</p>
          )}
          {reply && !reply.deletedAt ? (
            <button
              type="button"
              className={cn(
                "mb-2 w-full rounded-lg border-l-2 px-2 py-1 text-left text-xs opacity-90",
                mine ? "border-primary-foreground/50 bg-black/10" : "border-primary bg-background/50",
              )}
              onClick={() => {
                const rid =
                  typeof reply._id === "string"
                    ? reply._id
                    : String((reply as GroupChatMessage)._id);
                scrollToMessage(rid);
              }}
            >
              <span className="font-medium">
                {senderProfile(reply)?.name ?? "Message"}
              </span>
              <p className="line-clamp-2 opacity-80">{(reply.text ?? "").trim() || "Attachment"}</p>
            </button>
          ) : null}
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[60px] text-sm text-foreground"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void updateMsg.mutateAsync({
                      messageId: m._id,
                      content: editText,
                    });
                    setEditingId(null);
                  }}
                >
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {body ? <p className="whitespace-pre-wrap">{body}</p> : null}
              {m.attachmentsMeta?.length ? (
                <MessageAttachments
                  attachments={m.attachmentsMeta}
                  mine={mine}
                  onSignedMediaError={onAttachmentSignedMediaError}
                />
              ) : null}
            </>
          )}
          {(m.reactions?.length ?? 0) > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {Object.entries(
                (m.reactions ?? []).reduce<Record<string, number>>((acc, r) => {
                  acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
                  return acc;
                }, {}),
              ).map(([emoji, count]) => (
                <button
                  key={emoji}
                  type="button"
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs",
                    mine ? "bg-black/20" : "bg-background/80",
                  )}
                  onClick={() =>
                    toggleReaction.mutate({ messageId: m._id, emoji })
                  }
                >
                  {emoji} {count}
                </button>
              ))}
            </div>
          ) : null}
          <div
            className={cn(
              "mt-1 flex items-center gap-2 text-[10px] opacity-70",
              mine ? "justify-end" : "",
            )}
          >
            {m.editedAt ? <span>edited</span> : null}
            {m.createdAt ? (
              <span>
                {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
              </span>
            ) : null}
          </div>
        </div>
        {canPost ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={mine ? "end" : "start"}>
              <DropdownMenuItem onClick={() => setReplyTo(m)}>
                <Reply className="mr-2 h-4 w-4" />
                Reply
              </DropdownMenuItem>
              {QUICK_EMOJI.map((e) => (
                <DropdownMenuItem
                  key={e}
                  onClick={() => toggleReaction.mutate({ messageId: m._id, emoji: e })}
                >
                  <Smile className="mr-2 h-4 w-4" />
                  React {e}
                </DropdownMenuItem>
              ))}
              {mine ? (
                <DropdownMenuItem
                  onClick={() => {
                    setEditingId(m._id);
                    setEditText(body);
                  }}
                >
                  Edit
                </DropdownMenuItem>
              ) : null}
              {(mine || canModerate) && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => deleteMsg.mutate(m._id)}
                >
                  Delete
                </DropdownMenuItem>
              )}
              {canModerate ? (
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await pinGroupChatMessage(groupId, m._id);
                      toast.success("Message pinned");
                    } catch {
                      toast.error("Could not pin");
                    }
                  }}
                >
                  <Pin className="mr-2 h-4 w-4" />
                  Pin
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    );
  };

  return (
    <div className="flex h-[min(72vh,640px)] flex-col overflow-hidden rounded-2xl border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Button
          type="button"
          size="sm"
          variant={searchOpen ? "secondary" : "ghost"}
          className="gap-1"
          onClick={() => setSearchOpen((v) => !v)}
        >
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>

      {searchOpen ? (
        <div className="border-b p-3">
          <div className="flex gap-2">
            <Input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search messages…"
              onKeyDown={(e) => e.key === "Enter" && void runSearch()}
            />
            <Button type="button" size="sm" onClick={() => void runSearch()}>
              Go
            </Button>
          </div>
          {searching ? (
            <Loader2 className="mx-auto mt-3 h-4 w-4 animate-spin" />
          ) : searchHits.length > 0 ? (
            <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-sm">
              {searchHits.map((hit) => (
                <li key={hit._id}>
                  <button
                    type="button"
                    className="w-full rounded px-2 py-1 text-left hover:bg-muted"
                    onClick={() => scrollToMessage(hit._id)}
                  >
                    <span className="line-clamp-1">{(hit.text ?? "").trim() || "Attachment"}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {pinned.length > 0 ? (
        <div className="border-b bg-muted/40 px-3 py-2">
          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <Pin className="h-3 w-3" />
            Pinned
          </p>
          <div className="space-y-1">
            {pinned.map((p) => (
              <button
                key={p._id}
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-lg bg-background/80 px-2 py-1 text-left text-xs hover:bg-background"
                onClick={() => scrollToMessage(p._id)}
              >
                <span className="line-clamp-1">{(p.text ?? "").trim() || "Attachment"}</span>
                {canModerate ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      void unpinGroupChatMessage(groupId, p._id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div ref={scrollerRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {hasOlder ? (
          <div className="flex justify-center pb-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={q.isFetchingNextPage}
              onClick={loadOlder}
            >
              {q.isFetchingNextPage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Load older messages"
              )}
            </Button>
          </div>
        ) : null}

        {q.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No messages yet. Say hello to your course group.
          </p>
        ) : (
          messages.map((m) => renderMessage(m))
        )}
      </div>

      {canPost ? (
        <div className="border-t p-3">
          {replyTo ? (
            <div className="mb-2 flex items-center justify-between rounded-lg bg-muted px-2 py-1 text-xs">
              <span className="line-clamp-1">
                Replying to {(replyPreview(replyTo)?.text ?? replyTo.text ?? "").trim() || "message"}
              </span>
              <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setReplyTo(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : null}
          {peerTyping ? (
            <p className="mb-2 text-xs text-muted-foreground">
              {peerTyping.name ?? "Someone"} is typing…
            </p>
          ) : null}
          {uploading && uploadPct > 0 && uploadPct < 100 ? (
            <p className="mb-2 text-xs text-muted-foreground">Uploading… {uploadPct}%</p>
          ) : null}
          <div className="flex items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFilePick(f);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={uploading || send.isPending}
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <VoiceRecorder
              disabled={uploading || send.isPending}
              onSend={async ({ blob, duration }) => onVoice(blob, duration)}
            />
            <Textarea
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="Message your course group…"
              className="min-h-[44px] max-h-28 flex-1 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSendText();
                }
              }}
            />
            <Button
              type="button"
              size="icon"
              disabled={!text.trim() || uploading || send.isPending}
              onClick={onSendText}
            >
              {send.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <p className="border-t p-4 text-center text-sm text-muted-foreground">
          Join the course group to participate in chat.
        </p>
      )}
    </div>
  );
}
