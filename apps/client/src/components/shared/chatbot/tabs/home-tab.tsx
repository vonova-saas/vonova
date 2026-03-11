"use client";


import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, Send } from "lucide-react";
import type { Conversation } from "../mock-data";

type Props = {
  latest: Conversation[];
  onStart: (q: string) => void;
  onOpenConversation: (conv: Conversation) => void;
};


export default function HomeTab({ latest, onStart, onOpenConversation }: Props) {
  const [q, setQ] = useState("");

  const handleSend = () => {
    if (!q.trim()) return;
    onStart(q.trim());
    setQ("");
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="flex flex-col">

          {/* ── Hero section — brand gradient ── */}
          <div className="bg-gradient-to-b from-[#863d01] to-[#ce6c1c] px-5 pt-7 pb-10 text-white">

            {/* Logo image + "Vonova" text side by side */}
            <div className="flex items-center gap-2 mb-5">
              <Image
                src="/favicon.ico"
                alt="Vonova logo"
                width={28}
                height={28}
                className="rounded-sm"
              />
              <span className="text-white font-semibold text-base tracking-wide">Vonova</span>
            </div>

            <h2 className="text-2xl font-bold leading-tight mb-1">Hello There!</h2>
            <p className="text-lg font-semibold text-white/80">How can we help?</p>
          </div>

          {/* ── Cards container — overlaps hero slightly ── */}
          <div className="px-3 -mt-4 space-y-3 pb-4">

            {/* ── Recent conversations card ── */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-border overflow-hidden">

              {/* "Recent" label inside the card */}
              <div className="px-4 pt-3 pb-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Recent
                </p>
              </div>

              <div className="divide-y divide-border">
                {latest.length > 0 ? (
                  latest.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onOpenConversation(c)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                    >
                      <span className="text-sm truncate pr-2">{c.title}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent conversations
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      </ScrollArea>

      {/* ── Sticky input — always visible at bottom, starts a new conversation ── */}
      <div className="shrink-0 border-t bg-background px-3 py-3">
        <div className="flex gap-2">
          <Input
            placeholder="Ask a question..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 text-sm"
          />
          <Button onClick={handleSend} disabled={!q.trim()} size="icon" aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}