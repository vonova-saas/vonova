"use client";

// import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMemo, useState } from "react";
import BottomNav, { type ChatTab } from "./bottom-nav";
import { faqs, conversations as seedConversations, tasks, type Conversation } from "./mock-data";
import HelpTab from "./tabs/help-tab";
import HomeTab from "./tabs/home-tab";
import MessagesTab from "./tabs/messages-tab";
import TasksTab from "./tabs/tasks-tab";
import ChatbotLauncher from "./launcher-button";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ChatTab>("home");
  const [conversations, setConversations] = useState<Conversation[]>(seedConversations);

  const latest = useMemo(() => {
    return [...conversations].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)).slice(0, 3);
  }, [conversations]);

  const startConversation = (question: string) => {
    const id = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id,
      title: question.trim() || "New conversation",
      lastMessageAt: new Date().toISOString(),
      messages: [
        { id: `${id}-u1`, sender: "user", content: question || "Hello", timestamp: new Date().toISOString() },
        { id: `${id}-b1`, sender: "bot", content: "Thanks! I'm a demo bot. A real AI reply will appear here in the future.", timestamp: new Date().toISOString() },
      ],
    };
    setConversations((prev) => [newConv, ...prev]);
    setTab("messages");
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {/* <Button size="lg" className="rounded-full shadow-lg h-14 w-14 cursor-pointer p-0" aria-label="Open assistant">
            <Bot className="h-6 w-6" />
          </Button> */}
          <ChatbotLauncher aria-label="Open assistant" />
        </DialogTrigger>

        <DialogContent
          showCloseButton
          position="bottom-right"
          overlayClassName="bg-transparent"
          className="p-0 w-[380px] sm:w-[420px] max-w-[90vw] border-none shadow-2xl rounded-2xl overflow-hidden bottom-24"
        >
          <DialogHeader className="px-4 pt-4 pb-2 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Messages
            </DialogTitle>
          </DialogHeader>
          <div className="h-[520px] flex flex-col bg-background">
            <div className="flex-1 overflow-hidden">
              {tab === "home" && <HomeTab latest={latest} onStart={(q) => startConversation(q)} />}
              {tab === "messages" && <MessagesTab conversations={conversations} />}
              {tab === "help" && <HelpTab faqs={faqs} />}
              {tab === "tasks" && <TasksTab tasks={tasks} />}
            </div>
            <BottomNav value={tab} onChange={setTab} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
