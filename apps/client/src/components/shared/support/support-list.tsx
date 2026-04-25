"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/context/app/auth/auth-context";
import { addSupportMessageMutationFn, getSupportTicketMutationFn } from "@/services/app/support/support.api";
import type { getSupportTicketResponseType } from "@/types/api/app/support/support.type";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/global/icons";
import { avatarImgSrcForDisplay } from "@/lib/avatar-display-url";
import { getAvatarFallbackText } from "@/utils/functions/app/helper";
import { toast } from "sonner";
import type { SupportCategory, SupportStatus } from "@/types/api/app/support/support.type";

interface SupportItem {
  _id: string;
  category: SupportCategory;
  status: SupportStatus;
  subject: string;
  message: string;
  messages?: Array<{
    sender?: string;
    message?: string;
    createdAt?: string;
    senderName?: string;
    senderAvatarUrl?: string | null;
  }>;
  createdAt: string;
}

type SupportThreadItem = NonNullable<SupportItem["messages"]>[number];

export function SupportList() {
  const { user } = useAuthContext();
  const userId = useMemo(() => {
    // Always use the authenticated user's ID if available
    if (user?._id) return user._id;
    return "";
  }, [user?._id]);

  const [items, setItems] = useState<SupportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [draftReplies, setDraftReplies] = useState<Record<string, string>>({});
  const [sendingReplies, setSendingReplies] = useState<Record<string, boolean>>({});

  async function load() {
    try {
      if (!userId) return;
      setLoading(true);
      const res: getSupportTicketResponseType = await getSupportTicketMutationFn(userId);
      setItems(res.data);
    } catch (e) {
      toast.error((e as Error).message || "Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const onUpdated = () => load();
    if (typeof window !== "undefined") {
      window.addEventListener("support:updated", onUpdated);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("support:updated", onUpdated);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function getPreview(it: SupportItem) {
    const thread = it.messages ?? [];
    const last = thread.length > 0 ? thread[thread.length - 1] : null;
    if (last?.message) {
      const fromSupport = last.sender && last.sender !== "user";
      const who = fromSupport ? (last.senderName?.trim() || "Support") : "You";
      const prefix = `${who}: `;
      const text = `${prefix}${last.message}`;
      return text.trim();
    }
    const text = it.message || "";
    return text.trim();
  }

  function getRecentThread(it: SupportItem): SupportThreadItem[] {
    const thread = it.messages ?? [];
    if (!thread.length) return [];
    return thread.slice(-3);
  }

  async function onReply(ticketId: string) {
    if (!userId) {
      toast.error("Missing user id in URL");
      return;
    }
    const message = (draftReplies[ticketId] || "").trim();
    if (!message) return;
    try {
      setSendingReplies((prev) => ({ ...prev, [ticketId]: true }));
      await addSupportMessageMutationFn(userId, ticketId, { message });
      setDraftReplies((prev) => ({ ...prev, [ticketId]: "" }));
      toast.success("Reply sent");
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Failed to send reply");
    } finally {
      setSendingReplies((prev) => ({ ...prev, [ticketId]: false }));
    }
  }

  if (!userId) return null;

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Your support tickets</h3>
        {loading ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Icons.spinner className="h-4 w-4 animate-spin" /> Loading
          </div>
        ) : null}
      </div>
      {items.length === 0 && !loading ? (
        <p className="text-sm text-muted-foreground">No tickets yet.</p>
      ) : (
        <div className="grid gap-3">
          {items.map((it) => (
            <Card key={it._id} className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium capitalize">{it.category.replace("-", " ")}</div>
                  <span className={`rounded-full px-2 py-0.5 text-xs capitalize border ${
                    it.status === 'open' ? 'bg-green-50 text-green-700 border-green-200'
                    : it.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : it.status === 'resolved' ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}>{it.status}</span>
                </div>
                <div className="text-sm">{it.subject}</div>
                <div className="text-base text-muted-foreground flex items-start gap-2">
                  {(() => {
                    const thread = it.messages ?? [];
                    const last = thread.length > 0 ? thread[thread.length - 1] : null;
                    const fromSupport = last && last.sender && last.sender !== "user";
                    const src =
                      fromSupport && last?.senderAvatarUrl
                        ? avatarImgSrcForDisplay(last.senderAvatarUrl)
                        : null;
                    const label = fromSupport
                      ? last?.senderName?.trim() || "Support"
                      : "You";
                    if (!fromSupport || !src) {
                      return (
                        <span className="whitespace-pre-wrap wrap-break-word">
                          {getPreview(it)}
                        </span>
                      );
                    }
                    return (
                      <>
                        <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                          <AvatarImage src={src} alt="" referrerPolicy="no-referrer" />
                          <AvatarFallback className="text-xs">{getAvatarFallbackText(label)}</AvatarFallback>
                        </Avatar>
                        <span className="whitespace-pre-wrap wrap-break-word">
                          {getPreview(it)}
                        </span>
                      </>
                    );
                  })()}
                </div>
                {getRecentThread(it).length > 0 ? (
                  <div className="mt-2 space-y-3">
                    {getRecentThread(it).map((m, idx) => {
                      const fromSupport = m.sender && m.sender !== "user";
                      const label = fromSupport
                        ? m.senderName?.trim() || "Support"
                        : "You";
                      const avatarSrc =
                        fromSupport && m.senderAvatarUrl
                          ? avatarImgSrcForDisplay(m.senderAvatarUrl)
                          : null;
                      return (
                        <div
                          key={`${m.createdAt || "now"}-${idx}`}
                          className="flex items-start gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-3"
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            {avatarSrc ? (
                              <AvatarImage
                                src={avatarSrc}
                                alt=""
                                referrerPolicy="no-referrer"
                              />
                            ) : null}
                            <AvatarFallback className="text-xs">
                              {getAvatarFallbackText(label)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{label}</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap wrap-break-word">
                              {m.message || ""}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                <div className="text-xs text-muted-foreground">{new Date(it.createdAt).toLocaleString()}</div>
                <div className="pt-2 space-y-2">
                  <Textarea
                    value={draftReplies[it._id] || ""}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setDraftReplies((prev) => ({ ...prev, [it._id]: e.target.value }))
                    }
                    rows={2}
                    placeholder="Write a reply..."
                    className="text-sm"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => onReply(it._id)}
                      disabled={sendingReplies[it._id] || !(draftReplies[it._id] || "").trim()}
                    >
                      {sendingReplies[it._id] ? (
                        <Icons.spinner className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Icons.Send className="h-4 w-4 mr-2" />
                      )}
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
