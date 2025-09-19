"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import {
  PDFFile,
  PDFMessage,
} from "@/components/student/ai-lms/pdf-summary/types";
import {
  mockPDFFiles,
  mockMessages,
} from "@/components/student/ai-lms/pdf-summary/fake-data";
import PDFSummaryChat from "@/components/student/ai-lms/pdf-summary/pdf-summary-chat";
import useStudentId from "@/hooks/student/use-student-id";

export default function PDFChatPage() {
  const studentId = useStudentId();
  const params = useParams();
  const router = useRouter();
  const [currentPDF, setCurrentPDF] = useState<PDFFile | null>(null);
  const [messages, setMessages] = useState<PDFMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pdfId = params.id as string;

    // Simulate API call delay
    const timer = setTimeout(() => {
      // Find the PDF by ID
      const pdf = mockPDFFiles.find((p) => p.id === pdfId);
      if (pdf) {
        setCurrentPDF(pdf);
        // Filter messages for this specific PDF
        const pdfMessages = mockMessages.filter((m) => m.pdfId === pdfId);
        setMessages(pdfMessages);
      }
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [params.id]);

  const handleBackToFiles = () => {
    router.push(`/${studentId}/pdf-summary`);
  };

  if (loading) {
    return (
      <div
        className="h-full w-full flex flex-col overflow-hidden relative"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)",
          backgroundSize: "18px 18px",
        }}
      >
        <div className="flex items-center justify-center h-full">
          <Card className="w-96 p-8 text-center">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Loading PDF Chat
              </h2>
              <p className="text-muted-foreground">
                Preparing your conversation...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentPDF) {
    return (
      <div
        className="h-full w-full flex flex-col overflow-hidden relative"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)",
          backgroundSize: "18px 18px",
        }}
      >
        <div className="flex items-center justify-center h-full">
          <Card className="w-96 p-8 text-center">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                PDF Not Found
              </h2>
              <p className="text-muted-foreground mb-6">
                The PDF you&apos;re looking for doesn&apos;t exist or has been
                removed.
              </p>
              <Button onClick={handleBackToFiles} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to PDF Files
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full flex flex-col overflow-hidden relative"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)",
        backgroundSize: "18px 18px",
      }}
    >
      {/* Chat Interface */}
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
