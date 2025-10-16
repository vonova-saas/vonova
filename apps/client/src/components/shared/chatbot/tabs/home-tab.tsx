"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import type { Conversation } from "../mock-data";

export default function HomeTab({
  latest,
  onStart,
}: {
  latest: Conversation[];
  onStart: (q: string) => void;
}) {
  const [q, setQ] = useState("");
  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              Ask anything about using the LMS. This is a demo with fake data. We&apos;ll connect a real AI model later.
            </p>
          </div>
          <Separator />
          {/* Recent Chats */}
          <div>
            <p className="text-sm font-medium mb-2">Recent</p>
            <div className="space-y-2">
              {latest.map((c) => (
                <button
                  key={c.id}
                  className="w-full text-left rounded-md border px-3 py-2 hover:bg-muted/60 transition"
                  onClick={() => onStart(c.title)}
                >
                  <span className="truncate block">{c.title}</span>
                  <span className="text-xs text-muted-foreground">Tap to continue this topic</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ask a question */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ask a question</label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. How do I create a quiz?"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && q.trim() && onStart(q)}
              />
              <Button onClick={() => q.trim() && onStart(q)} disabled={!q.trim()} aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
