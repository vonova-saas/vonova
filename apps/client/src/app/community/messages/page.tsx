"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useConversations } from "@/hooks/app/community/use-social";
import { useAuthContextOptional } from "@/context/app/auth/auth-context";
import type {
  CommunityProfileSummary,
  DirectConversation,
} from "@/types/api/app/community/social.types";

function otherParticipant(
  conv: DirectConversation,
  meId: string | undefined,
): CommunityProfileSummary | null {
  for (const p of conv.participants ?? []) {
    if (typeof p === "object" && p?._id && p._id !== meId) {
      return p as CommunityProfileSummary;
    }
  }
  return null;
}

export default function CommunityMessagesPage() {
  const auth = useAuthContextOptional();
  const meId = auth?.user?._id;
  const { data, isLoading } = useConversations();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const conversations = data ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header>
        <h1 className="text-xl font-bold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Direct conversations with people you follow or message.
        </p>
      </header>

      {conversations.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No conversations yet. Open someone&apos;s profile and tap{" "}
          <span className="font-medium">Message</span> to start a chat.
        </Card>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {conversations.map((conv) => {
            const other = otherParticipant(conv, meId);
            const updated = conv.lastMessageAt ?? conv.updatedAt ?? conv.createdAt;
            return (
              <li key={conv._id}>
                <Link
                  href={`/community/messages/${conv._id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/60"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={other?.profilePictureUrl} alt={other?.name} />
                    <AvatarFallback>
                      {(other?.name ?? "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {other?.name ?? "Direct message"}
                      </p>
                      {updated && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(updated), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {conv.lastMessagePreview ?? "Open conversation"}
                    </p>
                  </div>
                  {(conv.unreadCount ?? 0) > 0 && (
                    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1.5 text-xs font-semibold text-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
