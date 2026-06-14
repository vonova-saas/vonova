"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { PDFFile, PDFMessage } from "@/components/student/ai-lms/pdf-summary/types";
import PDFSummaryChat from "@/components/student/ai-lms/pdf-summary/pdf-summary-chat";
import { useUserId } from "@/hooks";
import { getChatHistoryQueryFn, chatWithPDFMutationFn, getSessionsQueryFn } from "@/services/student/lms-ai/pdf-summary/pdf.api";
import { describeUnknownErrorForLog } from "@/utils/functions/app/usage-limit-error";

export default function PDFChatPage() {
  const studentId = useUserId();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params?.id as string;
  const forceFresh = searchParams?.get("fresh") === "1";

  const [currentPDF, setCurrentPDF] = useState<PDFFile | null>(null);
  const [messages, setMessages] = useState<PDFMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const hasSentAutoMessage = useRef(false);
  const [historyLoadedSuccessfully, setHistoryLoadedSuccessfully] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError(true);
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      try {
        setLoading(true);
        setHistoryLoadedSuccessfully(false);

        if (forceFresh) {
          setMessages([]);
          setHistoryLoadedSuccessfully(true);
        } else {
        
          // Load chat history using getChatHistoryQueryFn
          const historyData = await getChatHistoryQueryFn(sessionId);
          console.log("Chat history response:", historyData);
        
        // Accept multiple response shapes:
        // - { session_id, messages: [...] } (typed)
        // - { success, data: { chats: [...] } }
        // - { success, data: { messages: [...] } }
        // Example from your logs:
        // { success: true, message: '...', data: { chats: [...] } }
          let messagesArray: any[] = [];
          const hd = historyData as any;
          if (hd?.messages && Array.isArray(hd.messages)) {
            messagesArray = hd.messages;
          } else if (hd?.data?.messages && Array.isArray(hd.data.messages)) {
            messagesArray = hd.data.messages;
          } else if (hd?.data?.chats && Array.isArray(hd.data.chats)) {
            messagesArray = hd.data.chats;
          }

          const pickTimestamp = (obj: any) =>
            obj?.timestamp || obj?.created_at || obj?.createdAt || obj?.date;

          const normalizeText = (value: any) => {
            if (typeof value === "string") return value;
            if (value == null) return "";
            try {
              return JSON.stringify(value);
            } catch {
              return String(value);
            }
          };

        // Backend chat-history commonly comes as question/answer pairs per chat record.
        // Normalize to a flat message list so the UI can render and persist correctly.
          const converted: PDFMessage[] = [];
          messagesArray.forEach((msg: any, index: number) => {
          // Case 1: role-based message entries
          const role = msg?.role || msg?.sender || msg?.from;
          if (role === "user" || role === "assistant") {
            const content =
              msg?.content ?? msg?.message ?? msg?.text ?? msg?.value ?? "";
            converted.push({
              id: msg._id || msg.id || `msg-${index}-${sessionId}`,
              content: normalizeText(content),
              from: role,
              timestamp: pickTimestamp(msg) ? new Date(pickTimestamp(msg)) : new Date(),
              pdfId: sessionId,
              type: role === "user" ? "question" : "summary",
            });
            return;
          }

          // Case 2: question/answer record
          const question =
            msg?.question ?? msg?.prompt ?? msg?.user_question ?? msg?.q;
          const answer =
            msg?.answer ?? msg?.response ?? msg?.assistant_answer ?? msg?.a;

          if (question != null || answer != null) {
            const baseTime = pickTimestamp(msg) ? new Date(pickTimestamp(msg)) : new Date();
            if (question != null && normalizeText(question).trim()) {
              converted.push({
                id: `${msg?._id || msg?.id || `chat-${index}`}-q`,
                content: normalizeText(question),
                from: "user",
                timestamp: baseTime,
                pdfId: sessionId,
                type: "question",
              });
            }
            if (answer != null && normalizeText(answer).trim()) {
              converted.push({
                id: `${msg?._id || msg?.id || `chat-${index}`}-a`,
                content: normalizeText(answer),
                from: "assistant",
                timestamp: baseTime,
                pdfId: sessionId,
                type: "summary",
              });
            }
            return;
          }

          // Fallback: try common content fields, but don't push empty messages
          const fallback =
            msg?.content ?? msg?.message ?? msg?.text ?? msg?.value ?? "";
          const fallbackText = normalizeText(fallback).trim();
          if (fallbackText) {
            converted.push({
              id: msg._id || msg.id || `msg-${index}-${sessionId}`,
              content: fallbackText,
              from: "assistant",
              timestamp: pickTimestamp(msg) ? new Date(pickTimestamp(msg)) : new Date(),
              pdfId: sessionId,
              type: "summary",
            });
          }
          });

        // Ensure messages render chronologically (oldest at top, newest at bottom)
          converted.sort((a, b) => {
            const at = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp as any).getTime();
            const bt = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp as any).getTime();
            if (Number.isNaN(at) && Number.isNaN(bt)) return 0;
            if (Number.isNaN(at)) return 1;
            if (Number.isNaN(bt)) return -1;
            return at - bt;
          });
          
          setMessages(converted);
          setHistoryLoadedSuccessfully(true);
        }
        
        // Try to get real filename from sessions
        let fileName = "PDF Document";
        try {
          const sessionsData = await getSessionsQueryFn();
          const sessionRows = Array.isArray((sessionsData as any)?.data)
            ? (sessionsData as any).data
            : Array.isArray(sessionsData as any)
              ? (sessionsData as any)
              : [];
          const session = sessionRows.find((s: any) => s.session_id === sessionId);
          if (session) {
            fileName = session.filename || session.file_name || "PDF Document";
          }
        } catch (sessionErr) {
          console.log("Could not fetch sessions for file name:", sessionErr);
          // Try localStorage as fallback
          try {
            const localSessions = JSON.parse((typeof window !== 'undefined' ? localStorage.getItem("pdf_sessions") : null) || "[]");
            const localSession = localSessions.find((s: any) => s.session_id === sessionId);
            if (localSession) {
              fileName = localSession.filename || localSession.file_name;
            }
          } catch (localErr) {
            console.log("Could not read localStorage for file name:", localErr);
          }
        }
        
        setCurrentPDF({
          id: sessionId,
          name: fileName,
          size: 0,
          uploadedAt: new Date(),
          status: "ready",
          pages: 0,
          topics: [],
          lastAccessed: new Date(),
        });
      } catch (err) {
        console.error("Failed to load session:", err);
        setHistoryLoadedSuccessfully(false);
        // Don't show error, just show empty chat
        setCurrentPDF({
          id: sessionId,
          name: "PDF Document",
          size: 0,
          uploadedAt: new Date(),
          status: "ready",
          pages: 0,
          topics: [],
          lastAccessed: new Date(),
        });
        setMessages([]);
        setError(false); // important: don't show error screen
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId, forceFresh]);

  // Auto-send first message if session is empty
  useEffect(() => {
    if (hasSentAutoMessage.current) return;
    if (
      !loading &&
      historyLoadedSuccessfully &&
      currentPDF &&
      messages.length === 0 &&
      !hasSentAutoMessage.current
    ) {
      hasSentAutoMessage.current = true;
      
      const sendAutoMessage = async () => {
        const question = "Please provide a brief summary of this PDF";
        const userMessage: PDFMessage = {
          id: Date.now().toString(),
          content: question,
          from: "user",
          timestamp: new Date(),
          pdfId: sessionId,
          type: "question",
        };
        setMessages((prev) => [...prev, userMessage]);

        const delaysMs = [0, 1400];
        let lastErr: unknown;

        for (let attempt = 0; attempt < delaysMs.length; attempt++) {
          if (delaysMs[attempt] > 0) {
            await new Promise((r) => setTimeout(r, delaysMs[attempt]));
          }
          try {
            const response = await chatWithPDFMutationFn({
              session_id: sessionId,
              question,
            });

            const aiMessage: PDFMessage = {
              id: (Date.now() + 1).toString(),
              content:
                response.answer ||
                "I've analyzed the PDF and here's a summary of the key points.",
              from: "assistant",
              timestamp: new Date(),
              pdfId: sessionId,
              type: "summary",
            };

            setMessages((prev) => [...prev, aiMessage]);
            return;
          } catch (err) {
            lastErr = err;
            if (process.env.NODE_ENV !== "production") {
              // eslint-disable-next-line no-console
              console.warn(
                `[pdf-summary] auto message attempt ${attempt + 1}/${delaysMs.length} failed:`,
                describeUnknownErrorForLog(err),
              );
            }
          }
        }

        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error(
            "Failed to send auto message after retries:",
            describeUnknownErrorForLog(lastErr),
          );
        }
        const fallbackMessage: PDFMessage = {
          id: (Date.now() + 1).toString(),
          content:
            "I'm ready to help you analyze this PDF. Ask me any questions about the content!",
          from: "assistant",
          timestamp: new Date(),
          pdfId: sessionId,
          type: "summary",
        };
        setMessages((prev) => [...prev, fallbackMessage]);
      };
      
      // Small delay to ensure the chat interface is ready
      setTimeout(sendAutoMessage, 500);
    }
  }, [loading, historyLoadedSuccessfully, currentPDF, messages.length, sessionId]);

  const handleBackToFiles = () => {
    router.push(`/student/${studentId}/pdf-summary`);
  };

  const handleClearChatHistory = () => {
    hasSentAutoMessage.current = false;
    router.replace(`/student/${studentId}/pdf-summary/${sessionId}?fresh=1`);
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }}>
        <Card className="w-96 p-8 text-center">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h2 className="text-xl font-semibold">Loading PDF Chat</h2>
            <p className="text-muted-foreground">Preparing your conversation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }}>
        <Card className="w-96 p-8 text-center">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold">Session Not Found</h2>
            <p className="text-muted-foreground">
              This PDF session does not exist or has been removed.
            </p>
            <Button onClick={handleBackToFiles} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to PDF Files
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative"
      style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }}>
      <div className="flex-1 overflow-hidden">
        <PDFSummaryChat
          initialPDF={currentPDF}
          initialMessages={messages}
          isIndividualChat={true}
          onClearChatHistory={handleClearChatHistory}
        />
      </div>
    </div>
  );
}
