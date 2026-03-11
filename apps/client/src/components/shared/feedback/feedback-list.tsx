"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/context/app/auth/auth-context";
import { getFeedbackMutationFn, deleteFeedbackMutationFn } from "@/services/app/feedback/feedback.api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icons } from "@/components/global/icons";
import { toast } from "sonner";
import { updateFeedbackType, FeedbackStatus } from "@/types/api/app/feedback/feedback.type";

interface FeedbackItem {
  _id: string;
  feedbackType: updateFeedbackType['feedbackType'];
  userBugReport?: string | null;
  userSuggestion?: string | null;
  userFeatureRequest?: string | null;
  userOther?: string | null;
  status: FeedbackStatus;
  createdAt: string;
}

export function FeedbackList() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthContext();
  const userId = useMemo(() => {
    // Always use the authenticated user's ID if available
    if (user?._id) return user._id;
    return "";
  }, [user?._id]);

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      if (!userId) return;
      setLoading(true);
      const res = await getFeedbackMutationFn(userId);
      setItems(res.data);
    } catch (e) {
      toast.error((e as Error).message || "Failed to load feedbacks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const onUpdated = () => load();
    if (typeof window !== 'undefined') {
      window.addEventListener('feedback:updated', onUpdated);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('feedback:updated', onUpdated);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function shortId(id: string) {
    return `feedback-${id.slice(0, 6)}`;
  }

  function getPreview(it: FeedbackItem) {
    const text = it.userBugReport || it.userFeatureRequest || it.userSuggestion || it.userOther || "";
    return (text || "").trim().slice(0, 140) + (text && text.length > 140 ? "…" : "");
  }

  async function onDelete(id: string) {
    if (!userId) {
      toast.error("Missing user id in URL");
      return;
    }
    try {
      await deleteFeedbackMutationFn(userId, id);
      toast.success("Feedback deleted");
      // reload from server, so shared views stay in sync
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Failed to delete feedback");
    }
  }

  function onEdit(id: string) {
    const parts = pathname?.split("/").filter(Boolean) || [];
    const userId = parts[0] || "";
    router.push(`/${userId}/feedback/${shortId(id)}`);
  }

  if (!userId) return null;

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Your previous feedback</h3>
        {loading ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Icons.spinner className="h-4 w-4 animate-spin" /> Loading
          </div>
        ) : null}
      </div>
      {items.length === 0 && !loading ? (
        <p className="text-sm text-muted-foreground">No feedback yet.</p>
      ) : (
        <div className="grid gap-3">
          {items.map((it) => (
            <Card key={it._id} className="p-4 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium capitalize">{it.feedbackType.replace("-", " ")}</div>
                  <span className={`rounded-full px-2 py-0.5 text-xs capitalize border ${
                    it.status === 'open' ? 'bg-green-50 text-green-700 border-green-200'
                    : it.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : it.status === 'resolved' ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}>{it.status}</span>
                </div>
                <div className="text-sm text-muted-foreground">{getPreview(it)}</div>
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
