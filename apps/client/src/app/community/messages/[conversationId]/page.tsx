"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Check, CheckCheck, Loader2, MoreVertical, Paperclip, Pencil, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useConversations,
  useDeleteDmMessage,
  useMarkConversationSeen,
  useMessages,
  useSendMessage,
  useUpdateDmMessage,
  socialKeys,
} from "@/hooks/app/community/use-social";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";
import {
  SOCKET_EVENTS,
  useCommunitySocket,
  useSocketEvent,
} from "@/providers/community-socket-provider";
import { cn } from "@/lib/utils";
import { setCommunityPresenceView } from "@/lib/community/notification-presence";
import { VoiceRecorder } from "@/components/community/messages/voice-recorder";
import { MessageAttachments } from "@/components/community/messages/message-attachments";
import {
  presignMessageUpload,
  uploadToPresignedUrl,
  type CommunityAttachment,
} from "@/services/app/community/social.api";
import {
  primaryMime,
  resolveFileMessageUploadMeta,
  resolveVoiceMessageUploadMeta,
} from "@/lib/community/message-upload-meta";
import { toast } from "sonner";
import type { DirectMessage } from "@/types/api/app/community/social.types";

type TypingPayload = {
  conversationId: string;
  userId: string;
  name?: string;
  isTyping: boolean;
};

function participantId(p: unknown): string | undefined {
  if (typeof p === "string") return p;
  if (p && typeof p === "object" && "_id" in p) {
    return String((p as { _id?: string })._id ?? "");
  }
  return undefined;
}

function profilePicFromSummary(
  u:
    | import("@/types/api/app/community/social.types").CommunityProfileSummary
    | null
    | undefined,
): string | undefined {
  if (!u) return undefined;
  const x = u as typeof u & {
    profilePicture?: string | null;
    avatar?: string | null;
  };
  return (
    u.profilePictureUrl ||
    (typeof x.profilePicture === "string" ? x.profilePicture : undefined) ||
    (typeof x.avatar === "string" ? x.avatar : undefined) ||
    undefined
  );
}

/** API often populates `senderId` as a user object; optimistic sends `"me"`. */
function messageSenderIdString(m: {
  senderId?: import("@/types/api/app/community/social.types").DirectMessage["senderId"];
}): string {
  const raw = m.senderId;
  if (raw === "me") return "me";
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object" && "_id" in raw) {
    return String((raw as { _id: string })._id);
  }
  return "";
}

function messageSenderProfile(
  m: import("@/types/api/app/community/social.types").DirectMessage,
): import("@/types/api/app/community/social.types").CommunityProfileSummary | null {
  const raw = m.senderId;
  if (raw && typeof raw === "object" && "_id" in raw) {
    return raw as import("@/types/api/app/community/social.types").CommunityProfileSummary;
  }
  return null;
}

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = params?.conversationId ?? "";

  const qc = useQueryClient();
  const lastAttachInvalidate = useRef(0);
  const onAttachmentSignedMediaError = useCallback(() => {
    const now = Date.now();
    if (now - lastAttachInvalidate.current < 90_000) return;
    lastAttachInvalidate.current = now;
    void qc.invalidateQueries({ queryKey: socialKeys.messages(conversationId) });
  }, [qc, conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    setCommunityPresenceView({ kind: "conversation", id: conversationId });
    return () => setCommunityPresenceView(null);
  }, [conversationId]);

  const auth = useAuthContextOptional();
  const meId = auth?.user?._id;

  const { data, isLoading } = useMessages(conversationId);
  const { data: convs } = useConversations();
  const send = useSendMessage(conversationId);
  const updateDm = useUpdateDmMessage(conversationId);
  const deleteDm = useDeleteDmMessage(conversationId);
  const { mutate: markSeenMutate } = useMarkConversationSeen(conversationId);
  const socket = useCommunitySocket();

  const [content, setContent] = useState("");
  const [peerTyping, setPeerTyping] = useState<{
    userId: string;
    name?: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DirectMessage | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DirectMessage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  /** Blocks synchronous double-send before React flips `isPending` (Strict Mode / rapid Enter). */
  const sendLockRef = useRef(false);

  useEffect(() => {
    if (!conversationId || !socket.isConnected) return;
    socket.joinConversation(conversationId);
    return () => socket.leaveConversation(conversationId);
  }, [conversationId, socket]);

  useSocketEvent<TypingPayload>(
    SOCKET_EVENTS.MESSAGE_TYPING,
    (payload) => {
      if (!payload || payload.conversationId !== conversationId) return;
      if (payload.userId === meId) return;
      if (payload.isTyping) {
        setPeerTyping({ userId: payload.userId, name: payload.name });
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setPeerTyping(null), 2500);
      } else {
        setPeerTyping(null);
      }
    },
    [conversationId, meId],
  );

  /** Oldest → newest; dedupe by `_id` (optimistic + socket + refetch edge cases). */
  const chronologicalMessages = useMemo(() => {
    const pages = data?.pages ?? [];
    const flat = pages.slice().reverse().flatMap((p) => p.items);
    const seen = new Set<string>();
    return flat.filter((m) => {
      const id = String(m._id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [data]);

  const messages = chronologicalMessages;

  /** Latest message id from the other participant (stable primitive — avoids re-marking on seenBy cache patches). */
  const lastPeerMessageId = useMemo(() => {
    for (let i = chronologicalMessages.length - 1; i >= 0; i--) {
      const m = chronologicalMessages[i];
      const sid = messageSenderIdString(m);
      if (!m?._id || sid === "me" || (meId && sid === String(meId))) continue;
      if (String(m._id).startsWith("optim-")) continue;
      return m._id;
    }
    return null;
  }, [chronologicalMessages, meId]);

  const peerProfile = useMemo(() => {
    const list = Array.isArray(convs)
      ? convs
      : (convs as { items?: unknown[] } | undefined)?.items ?? [];
    const conv = (list as Array<{ _id?: string; participants?: unknown[] }>).find(
      (c) => c?._id === conversationId,
    );
    if (!conv?.participants?.length) return null;
    for (const p of conv.participants) {
      const id = participantId(p);
      if (!id || (meId && id === meId)) continue;
      if (p && typeof p === "object" && "name" in p) {
        return p as import("@/types/api/app/community/social.types").CommunityProfileSummary;
      }
    }
    return null;
  }, [convs, conversationId, meId]);

  const meAvatarUrl = auth?.user?.profilePicture ?? undefined;

  const peerId = useMemo(() => {
    const list = Array.isArray(convs)
      ? convs
      : (convs as { items?: unknown[] } | undefined)?.items ?? [];
    const conv = (list as Array<{ _id?: string; participants?: unknown[] }>).find(
      (c) => c?._id === conversationId,
    );
    if (!conv || !meId) return null;
    const others = (conv.participants ?? []).filter(
      (p: unknown) =>
        (typeof p === "string" ? p : (p as { _id?: string })._id) !== meId,
    );
    const first = others[0];
    return first
      ? typeof first === "string"
        ? first
        : ((first as { _id?: string })._id ?? null)
      : null;
  }, [convs, conversationId, meId]);

  // Auto-scroll on new messages / typing.
  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages.length, peerTyping]);

  // Mark read once per new peer message (do not depend on `messages` — socket
  // patches seenBy and would retrigger this effect → spam /seen → 429).
  useEffect(() => {
    if (!conversationId || !meId || !lastPeerMessageId) return;
    markSeenMutate(lastPeerMessageId);
  }, [conversationId, meId, lastPeerMessageId, markSeenMutate]);

  const submit = useCallback(() => {
    const value = content.trim();
    if (!value || send.isPending || sendLockRef.current) return;
    sendLockRef.current = true;
    send.mutate(
      { content: value },
      {
        onSettled: () => {
          sendLockRef.current = false;
        },
        onSuccess: () => setContent(""),
      },
    );
  }, [content, send]);

  const broadcastTyping = (isTyping: boolean) => {
    if (!conversationId) return;
    socket.emit(SOCKET_EVENTS.MESSAGE_TYPING, { conversationId, isTyping });
  };

  const handleAttachmentUpload = useCallback(
    async (file: File) => {
      if (uploading || send.isPending || sendLockRef.current) return;
      sendLockRef.current = true;
      setUploading(true);
      const toastId = toast.loading(`Uploading ${file.name}…`);
      try {
        const { kind, contentType } = resolveFileMessageUploadMeta(file);
        const presigned = await presignMessageUpload({
          originalName: file.name,
          contentType,
          kind,
        });
        const { url } = await uploadToPresignedUrl(
          presigned,
          file,
          contentType,
          (pct) => {
            toast.loading(`Uploading ${file.name} — ${pct}%`, { id: toastId });
          },
        );
        const meta: CommunityAttachment = {
          type: kind,
          url,
          key: presigned.key,
          mimeType: primaryMime(file.type) || contentType,
          size: file.size,
          name: file.name,
        };
        await send.mutateAsync({
          content: "",
          attachmentsMeta: [meta],
        });
        toast.success("Attachment sent", { id: toastId });
      } catch (err) {
        console.error(err);
        toast.error("Upload failed", { id: toastId });
      } finally {
        setUploading(false);
        sendLockRef.current = false;
      }
    },
    [send, uploading],
  );

  const handleVoiceSend = useCallback(
    async (rec: { blob: Blob; duration: number; mimeType: string }) => {
      if (send.isPending || sendLockRef.current) return;
      sendLockRef.current = true;
      const toastId = toast.loading("Sending voice…");
      try {
        const { contentType, filenameExt } = resolveVoiceMessageUploadMeta(rec);
        const filename = `voice-${Date.now()}.${filenameExt}`;
        const presigned = await presignMessageUpload({
          originalName: filename,
          contentType,
          kind: "VOICE",
        });
        const { url } = await uploadToPresignedUrl(
          presigned,
          rec.blob,
          contentType,
        );
        await send.mutateAsync({
          content: "",
          attachmentsMeta: [
            {
              type: "VOICE",
              url,
              key: presigned.key,
              mimeType: contentType,
              size: rec.blob.size,
              duration: rec.duration,
              name: filename,
            },
          ],
        });
        toast.success("Voice sent", { id: toastId });
      } catch (err) {
        console.error(err);
        toast.error("Failed to send voice", { id: toastId });
      } finally {
        sendLockRef.current = false;
      }
    },
    [send],
  );

  const saveEdit = useCallback(() => {
    if (!editTarget?._id) return;
    const next = editDraft.trim();
    updateDm.mutate(
      { messageId: String(editTarget._id), content: next },
      {
        onSuccess: () => {
          setEditOpen(false);
          setEditTarget(null);
        },
      },
    );
  }, [editDraft, editTarget, updateDm]);

  return (
    <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-3xl flex-col overflow-hidden rounded-2xl border bg-card">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-sm font-semibold">Conversation</h1>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs",
            socket.isConnected ? "text-emerald-600" : "text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              socket.isConnected ? "bg-emerald-500" : "bg-zinc-400",
            )}
          />
          {socket.isConnected ? "Live" : socket.status}
        </span>
      </header>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto">
        <div className="space-y-2 p-4">
          {isLoading ? (
            <div className="flex justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Say hi to start the conversation.
            </p>
          ) : (
            messages.map((m) => {
              const sid = messageSenderIdString(m);
              const mine = Boolean(
                meId &&
                  (sid === String(meId) || sid === "me"),
              );
              const seenByPeer =
                mine && peerId
                  ? (m.seenBy ?? []).some(
                      (u) => String(u) === String(peerId),
                    )
                  : false;
              const optimistic = String(m._id).startsWith("optim-");
              const hasContent = (m.content ?? "").trim().length > 0;
              const fromPopulated = messageSenderProfile(m);
              const label = mine
                ? auth?.user?.name?.trim() || "You"
                : fromPopulated?.name?.trim() ||
                  peerProfile?.name?.trim() ||
                  "Other participant";
              const avatarSrc = mine
                ? meAvatarUrl
                : profilePicFromSummary(fromPopulated ?? peerProfile);
              const when = m.createdAt
                ? formatDistanceToNow(new Date(m.createdAt), {
                    addSuffix: true,
                  })
                : null;
              return (
                <div
                  key={m._id}
                  className={cn(
                    "flex w-full gap-2.5",
                    mine ? "justify-start" : "justify-end",
                  )}
                >
                  <div
                    className={cn(
                      "flex min-w-0 max-w-[min(85vw,520px)] flex-col gap-1.5",
                      mine ? "items-start" : "items-end",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2",
                        mine ? "flex-row" : "flex-row-reverse",
                      )}
                    >
                      <Avatar className="h-9 w-9 shrink-0 border border-border/60">
                        <AvatarImage src={avatarSrc} alt={label} />
                        <AvatarFallback className="text-xs">
                          {label.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "flex min-w-0 flex-col leading-tight",
                          mine ? "items-start text-left" : "items-end text-right",
                        )}
                      >
                        <span className="text-sm font-semibold text-foreground">
                          {label}
                        </span>
                        {when ? (
                          <span className="text-[11px] text-muted-foreground">
                            {when}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "relative w-full rounded-2xl px-3 py-2 text-sm",
                        mine && !optimistic && "pr-10",
                        mine
                          ? "rounded-tl-sm rounded-br-2xl rounded-bl-2xl rounded-tr-2xl bg-violet-600 text-white"
                          : "rounded-tr-sm rounded-bl-2xl rounded-br-2xl rounded-tl-2xl bg-muted text-foreground",
                      )}
                    >
                      {mine && !optimistic && (
                        <div className="absolute right-1 top-1 z-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 text-white/90 hover:bg-white/15 hover:text-white"
                                aria-label="Message actions"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditTarget(m);
                                  setEditDraft(m.content ?? "");
                                  setEditOpen(true);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget(m)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                      {hasContent && (
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      )}
                      {m.editedAt ? (
                        <div
                          className={cn(
                            "text-[10px] italic opacity-80",
                            mine ? "text-white/75" : "text-muted-foreground",
                          )}
                        >
                          edited
                        </div>
                      ) : null}
                      <MessageAttachments
                        attachments={m.attachmentsMeta}
                        legacy={
                          m.attachments && !m.attachmentsMeta?.length
                            ? m.attachments
                            : undefined
                        }
                        mine={mine}
                        onSignedMediaError={onAttachmentSignedMediaError}
                      />
                      {mine && (
                        <div className="mt-1 flex justify-end text-[10px] opacity-80">
                          {optimistic ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : seenByPeer ? (
                            <CheckCheck className="h-3.5 w-3.5 text-emerald-200" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {peerTyping && (
            <div className="flex w-full justify-end">
              <div className="flex max-w-[min(85vw,520px)] flex-col items-end gap-1">
                <div className="flex flex-row-reverse items-center gap-2">
                  <Avatar className="h-7 w-7 border border-border/60">
                    <AvatarImage
                      src={profilePicFromSummary(peerProfile)}
                      alt={peerTyping.name ?? "Other"}
                    />
                    <AvatarFallback className="text-[10px]">
                      {(peerTyping.name ?? "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-muted-foreground">
                    {peerTyping.name ?? "Someone"} is typing…
                  </span>
                </div>
                <div className="inline-flex gap-0.5 rounded-2xl bg-muted/80 px-3 py-2">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
          broadcastTyping(false);
        }}
        className="flex items-end gap-2 border-t bg-background p-3"
      >
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/*,video/*,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleAttachmentUpload(f);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={uploading || send.isPending}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0"
          aria-label="Attach file"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
        </Button>
        <VoiceRecorder onSend={handleVoiceSend} disabled={send.isPending} />
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            broadcastTyping(e.target.value.length > 0);
          }}
          onBlur={() => broadcastTyping(false)}
          placeholder="Write a message..."
          className="min-h-10 resize-none"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
              broadcastTyping(false);
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          className="shrink-0"
          disabled={!content.trim() || send.isPending}
        >
          {send.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditOpen(false);
            setEditTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit message</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            placeholder="Message text"
            rows={4}
            className="resize-y"
          />
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditOpen(false);
                setEditTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void saveEdit()}
              disabled={updateDm.isPending}
            >
              {updateDm.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
              {(deleteTarget?.content ?? "").trim() ? (
                <span className="mt-2 block rounded-md bg-muted px-2 py-1.5 text-foreground">
                  {(deleteTarget?.content ?? "").trim().slice(0, 200)}
                  {(deleteTarget?.content ?? "").trim().length > 200 ? "…" : ""}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDm.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteDm.isPending}
              onClick={(e) => {
                e.preventDefault();
                const id = deleteTarget?._id;
                if (!id) return;
                deleteDm.mutate(String(id), {
                  onSettled: () => setDeleteTarget(null),
                });
              }}
            >
              {deleteDm.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
