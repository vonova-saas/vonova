"use client";
import { Home, MessageSquare, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMemo, useState, useEffect } from "react";
import * as React from "react";
import { usePathname } from "next/navigation";
import { ChatRequestType, ChatResponseType } from "@/types/api/ai/chatbot/chatbot.type";
import { sendChatMessageMutationFn } from "@/services/ai/chatbot/chatbot.api";

import BottomNav, { type ChatTab } from "./bottom-nav";
import { faqs, conversations as seedConversations, type Conversation, type ChatMessage } from "./mock-data";
import HelpTab from "./tabs/help-tab";
import HomeTab from "./tabs/home-tab";
import MessagesTab from "./tabs/messages-tab";
import ChatView from "./tabs/chat-view";
import ChatbotLauncher from "./launcher-button";

const TAB_META = {
  home: { icon: Home, title: "Home" },
  messages: { icon: MessageSquare, title: "Messages" },
  help: { icon: HelpCircle, title: "Help" },
} as const;

export default function ChatbotWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ChatTab>("home");
  const [conversations, setConversations] = useState<Conversation[]>(seedConversations);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  // Reset to Home every time widget opens
  useEffect(() => {
    if (open) {
      setTab("home");
      setActiveConversation(null);
    }
  }, [open]);


  useEffect(() => {
    if (!activeConversation) return;
    const msgs = activeConversation.messages;
    if (msgs.length === 1 && msgs[0].sender === "user") {
      sendMessage(activeConversation.id, msgs[0].content, true); // <-- true = skip adding user msg again
    }
  }, [activeConversation?.id]);

  const latest = useMemo(() => {
    return [...conversations]
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
      .slice(0, 3);
  }, [conversations]);

  const openConversation = (conv: Conversation) => setActiveConversation(conv);

  // Creates conversation with only user message, then useEffect triggers API call
  const startConversation = (question: string) => {
    const id = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id,
      title: question.trim() || "New conversation",
      lastMessageAt: new Date().toISOString(),
      messages: [
        { id: `${id}-u1`, sender: "user", content: question, timestamp: new Date().toISOString() },
      ],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversation(newConv);
  };

  const sendMessage = async (convId: string, text: string, skipUserMessage = false) => {
    const now = new Date().toISOString();

    const userMsg: ChatMessage = { id: `msg-${Date.now()}-u`, sender: "user", content: text, timestamp: now };
    const loadingMsg: ChatMessage = { id: `msg-loading-${Date.now()}`, sender: "bot", content: "...", timestamp: now };

    // Add user message only if not already added (skipUserMessage=false)
    const updateWithLoading = (c: Conversation): Conversation =>
      c.id === convId
        ? { ...c, messages: [...c.messages, ...(skipUserMessage ? [] : [userMsg]), loadingMsg], lastMessageAt: now }
        : c;

    setConversations((prev) => prev.map(updateWithLoading));
    setActiveConversation((prev) => prev?.id === convId ? updateWithLoading(prev) : prev);

    try {
      const request: ChatRequestType = { message: text, lang: "en" };
      const response: ChatResponseType = await sendChatMessageMutationFn(request);
      console.log("FULL RESPONSE:", response);
      console.log("REPLY:", response.reply);
      const botMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: "bot",
        content: response.reply,
        timestamp: new Date().toISOString(),
        image: response.image,
      };

      // Replace loading bubble with real response
      const updateWithResponse = (c: Conversation): Conversation =>
        c.id === convId
          ? { ...c, messages: [...c.messages.slice(0, -1), botMsg], lastMessageAt: botMsg.timestamp }
          : c;

      setConversations((prev) => prev.map(updateWithResponse));
      setActiveConversation((prev) => prev?.id === convId ? updateWithResponse(prev) : prev);

    } catch (error) {
      console.error("Chat API error:", error);
      const errMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: "bot",
        content: "Sorry, I'm having trouble connecting. Please try again later.",
        timestamp: new Date().toISOString(),
      };

      const updateWithError = (c: Conversation): Conversation =>
        c.id === convId
          ? { ...c, messages: [...c.messages.slice(0, -1), errMsg] }
          : c;

      setConversations((prev) => prev.map(updateWithError));
      setActiveConversation((prev) => prev?.id === convId ? updateWithError(prev) : prev);
    }
  };

  const TabIcon = TAB_META[tab].icon;

  const isPdfIndividualChat = /\/pdf-summary\/[^/]+$/.test(pathname || "");
  if (isPdfIndividualChat) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <ChatbotLauncher aria-label="Open assistant" />
        </DialogTrigger>

        <DialogContent
          showCloseButton
          position="bottom-right"
          overlayClassName="bg-transparent"
          className="
            p-0 flex flex-col
            w-[380px] h-[560px]
            max-w-[90vw]
            border-none shadow-2xl rounded-2xl overflow-hidden
            bottom-20 right-6
          "
        >
          {/* Always-present hidden title for screen readers */}
          <DialogTitle className="sr-only">Vonova AI Assistant</DialogTitle>

          {/* Tab label bar — only for Messages and Help */}
          {!activeConversation && tab !== "home" && (
            <DialogHeader className="px-4 py-3 border-b flex flex-row items-center gap-3 bg-muted/40 shrink-0 space-y-0">
              <TabIcon className="h-5 w-5 text-primary" />
              <span className="font-semibold">{TAB_META[tab].title}</span>
            </DialogHeader>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            {activeConversation ? (
              <ChatView
                conversation={activeConversation}
                onBack={() => setActiveConversation(null)}
                onSend={(text) => sendMessage(activeConversation.id, text)}
              />
            ) : (
              <>
                <div className="flex-1 overflow-hidden">
                  {tab === "home" && <HomeTab latest={latest} onStart={startConversation} onOpenConversation={openConversation} />}
                  {tab === "messages" && <MessagesTab conversations={conversations} onOpenConversation={openConversation} />}
                  {tab === "help" && <HelpTab faqs={faqs} />}
                </div>
                <BottomNav value={tab} onChange={setTab} />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}