"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { PDFFile, PDFMessage } from "@/components/student/ai-lms/pdf-summary/types";
import PDFSummaryChat from "@/components/student/ai-lms/pdf-summary/pdf-summary-chat";
import useStudentId from "@/hooks/student/use-student-id";
import { getChatHistoryQueryFn } from "@/services/student/lms-ai/pdf-summary/pdf.api";

export default function PDFChatPage() {
  const studentId = useStudentId();
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;

  const [currentPDF, setCurrentPDF] = useState<PDFFile | null>(null);
  const [messages, setMessages] = useState<PDFMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError(true);
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      try {
        setLoading(true);
        const history = await getChatHistoryQueryFn(sessionId);
        const converted: PDFMessage[] = (history?.messages ?? []).map((msg) => ({
          id: msg.id,
          content: msg.content,
          from: msg.role === "user" ? "user" : "assistant",
          timestamp: new Date(msg.timestamp),
          pdfId: sessionId,
          type: msg.role === "user" ? "question" : "summary",
        }));
        setMessages(converted);
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
      } catch (err) {
        console.error("Failed to load session:", err);
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
  }, [sessionId]);

  const handleBackToFiles = () => {
    router.push(`/student/${studentId}/pdf-summary`);
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
        />
      </div>
    </div>
  );
}
