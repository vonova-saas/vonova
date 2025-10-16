"use client";

import { ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Conversation } from "../mock-data";

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `${hours}h ago`;
  const mins = Math.floor(diff / (1000 * 60));
  return `${mins}m ago`;
}

export default function MessagesTab({ conversations }: { conversations: Conversation[] }) {
  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-1">
          {conversations.map((c) => (
            <div key={c.id} className="rounded-md hover:bg-muted/60">
              <button className="w-full px-3 py-2 flex items-center justify-between text-left">
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.messages[c.messages.length - 1]?.content}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{formatRelative(c.lastMessageAt)}</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </button>
              <Separator />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
