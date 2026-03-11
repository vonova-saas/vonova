"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Conversation } from "../mock-data";

type Props = {
  conversation: Conversation;
  onBack: () => void;
  onSend: (text: string) => void;
};

// Convert Google Drive /view or /edit link to /preview for iframe
function toDriveEmbed(url: string): string {
  return url.replace(/\/(view|edit).*$/, "/preview");
}

export default function ChatView({ conversation, onBack, onSend }: Props) {
  const [input, setInput] = useState("");
  const bottomRef         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Back button + title */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/40 shrink-0">
        <button onClick={onBack} className="p-1 rounded-md hover:bg-muted transition" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="font-semibold text-sm truncate">{conversation.title}</p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-3">
          {conversation.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex flex-col gap-1", msg.sender === "user" ? "items-end" : "items-start")}
            >
              {/* Text bubble */}
              <div
                className={cn(
                  "max-w-[75%] w-fit break-words rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm break-all"
                    : "bg-muted text-foreground rounded-bl-sm"
                )}
              >
                {/* Animated loading dots */}
                {msg.content === "..." ? (
                  <div className="flex items-center gap-1 py-1">
                    <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                ) : (
                  msg.content
                )}
              </div>

              {/* Google Drive image iframe — below the bubble */}
              {msg.sender === "bot" && msg.image && (
                <div className="w-full max-w-[280px] rounded-xl overflow-hidden border border-border shadow-sm">
                  <iframe
                    src={toDriveEmbed(msg.image)}
                    title="Image"
                    className="w-full h-52"
                    loading="lazy"
                    allow="autoplay"
                  />
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex gap-2 px-3 py-3 border-t shrink-0">
        <Input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={!input.trim()} size="icon" aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}