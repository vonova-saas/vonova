"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/context/app/auth/auth-context";
import { getSupportTicketMutationFn, deleteSupportTicketMutationFn } from "@/services/app/support/support.api";
import type { getSupportTicketResponseType } from "@/types/api/app/support/support.type";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

export function SupportList() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthContext();
  const userId = useMemo(() => {
    // Always use the authenticated user's ID if available
    if (user?._id) return user._id;
    return "";
  }, [user?._id]);

  const [items, setItems] = useState<SupportItem[]>([]);
  const [loading, setLoading] = useState(false);

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

  function shortId(id: string) {
    return `support-${id.slice(0, 6)}`;
  }

  function getPreview(it: SupportItem) {
    const thread = it.messages ?? [];
    const last = thread.length > 0 ? thread[thread.length - 1] : null;
    if (last?.message) {
      const fromSupport = last.sender && last.sender !== "user";
      const who = fromSupport ? (last.senderName?.trim() || "Support") : "You";
      const prefix = `${who}: `;
      const text = `${prefix}${last.message}`;
      return text.trim().slice(0, 140) + (text.length > 140 ? "…" : "");
    }
    const text = it.message || "";
    return text.trim().slice(0, 140) + (text && text.length > 140 ? "…" : "");
  }

  async function onDelete(id: string) {
    if (!userId) {
      toast.error("Missing user id in URL");
      return;
    }
    try {
      await deleteSupportTicketMutationFn(userId, id);
      toast.success("Support ticket deleted");
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Failed to delete ticket");
    }
  }

  function onEdit(id: string) {
    const parts = pathname?.split("/").filter(Boolean) || [];
    const userId = parts[0] || "";
    router.push(`/${userId}/support/${shortId(id)}`);
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
            <Card key={it._id} className="p-4 flex items-start justify-between">
              <div className="space-y-1">
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
                <div className="text-sm text-muted-foreground flex items-start gap-2 min-w-0">
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
                      return <span className="min-w-0">{getPreview(it)}</span>;
                    }
                    return (
                      <>
                        <Avatar className="h-7 w-7 mt-0.5 shrink-0">
                          <AvatarImage src={src} alt="" referrerPolicy="no-referrer" />
                          <AvatarFallback className="text-xs">{getAvatarFallbackText(label)}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">{getPreview(it)}</span>
                      </>
                    );
                  })()}
                </div>
                <div className="text-xs text-muted-foreground">{new Date(it.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => onEdit(it._id)} title="Edit">
                  <Icons.Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(it._id)} title="Delete">
                  <Icons.Trash className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
