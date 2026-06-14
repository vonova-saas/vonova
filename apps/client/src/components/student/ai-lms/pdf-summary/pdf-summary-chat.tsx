"use client";
import { toast } from "sonner";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useUserId } from "@/hooks";
import { useDropzone } from "react-dropzone";
import {
  AIInput,
  AIInputTextarea,
  AIInputToolbar,
  AIInputSubmit,
} from "@/components/ui/ai/ai-components/input";
import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "@/components/ui/ai/ai-components/conversation";
import {
  TrashIcon,
  FileText,
  Upload,
  ArrowLeft,
  MessageSquare,
  Download,
  MoreVertical,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Bot,
  Mic,
  Play,
  Pause,
  Square,
  Sparkles,
  BookOpenCheck,
  ListTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PDFFile, PDFMessage, UploadProgress } from "./types";
import { mockPDFFiles, mockMessages } from "./fake-data";
import PDFChatMessage from "./pdf-chat-message";
import LastPDFChats from "./last-pdf-chats";
import { uploadPDFMutationFn, chatWithPDFMutationFn, getSessionsQueryFn } from "@/services/student/lms-ai/pdf-summary/pdf.api";
import { parseUsageLimitError } from "@/utils/functions/app/usage-limit-error";
import { useAiCanUse, useConsumeAiCredits } from "@/hooks/app/community/use-social";
import { getFeatureCost } from "@/lib/ai/credits";
import { GetSessionsResponse } from "@/types/api/student/lms-ai/pdf-summary/pdf.type";

interface PDFSummaryChatProps {
  initialPDF?: PDFFile | null;
  initialMessages?: PDFMessage[];
  isIndividualChat?: boolean;
  studentId?: string;
  onClearChatHistory?: () => void;
}

const MAX_PDF_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_UPLOAD_SIZE_LABEL = "10MB";

const PDF_QUICK_PROMPTS: {
  label: string;
  text: string;
  icon: typeof Sparkles;
}[] = [
  {
    label: "TL;DR",
    text: "Give a tight TL;DR of this PDF in five short bullets.",
    icon: Sparkles,
  },
  {
    label: "Terms",
    text: "List important terms from this PDF with one-line definitions each.",
    icon: BookOpenCheck,
  },
  {
    label: "Outline",
    text: "How is this document organized? Summarize each major section in order.",
    icon: ListTree,
  },
];
 
function PDFSummaryChat({
  initialPDF,
  initialMessages = [],
  isIndividualChat = false,
  studentId: propStudentId,
  onClearChatHistory,
}: PDFSummaryChatProps) {
  const rawId = useUserId();
  const studentId =
    (propStudentId && propStudentId !== "undefined" ? propStudentId : "") ||
    (rawId && rawId !== "undefined" ? rawId : "") ||
    (typeof window !== "undefined"
      ? window.location.pathname.split("/")[2] || ""
      : "");
  const router = useRouter();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<PDFMessage[]>(initialMessages);
  const [status, setStatus] = useState<
    "submitted" | "streaming" | "ready" | "error"
  >("ready");
  const [isTyping, setIsTyping] = useState(false);
  const [pdfs, setPdfs] = useState<PDFFile[]>(mockPDFFiles);
  const [localSessions, setLocalSessions] = useState<any[]>([]);

  // Fetch sessions with localStorage fallback
  const { data: sessionsData, isLoading } = useQuery<GetSessionsResponse>({
    queryKey: ["pdf-sessions"],
    queryFn: getSessionsQueryFn,
    enabled: !!studentId,
  });

  // Read localStorage only on the client after mount to avoid SSR/CSR hydration mismatches.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = JSON.parse(localStorage.getItem("pdf_sessions") || "[]");
      setLocalSessions(stored);
    } catch (err) {
      console.error("Failed to read localStorage sessions:", err);
      setLocalSessions([]);
    }
  }, []);

  // Convert sessions to PDFFile format with localStorage fallback
  const syncedPdfs = useMemo(() => {
    // Get sessions from API or localStorage fallback (loaded on client after mount)
    let sessions: any[] = [];
    const apiSessions = Array.isArray((sessionsData as any)?.data)
      ? (sessionsData as any).data
      : Array.isArray(sessionsData)
        ? (sessionsData as any)
        : [];

    if (apiSessions.length > 0) {
      sessions = apiSessions;
    } else if (localSessions.length > 0) {
      sessions = localSessions.map((session: any) => ({
        session_id: session.session_id,
        file_name: session.file_name || session.filename,
        file_size: session.file_size ?? session.fileSize ?? session.size ?? 0,
        page_count: session.page_count ?? session.pages ?? session.pageCount ?? 0,
        created_at: session.created_at,
        status: session.status || "ready",
      }));
    }

    // Convert sessions to PDFFile format
    return sessions.map((session: any) => ({
      id: session.session_id,
      name: session.file_name || session.filename || "PDF Document",
      size: Number(session.file_size ?? session.fileSize ?? session.size ?? 0) || 0,
      uploadedAt: new Date(session.created_at),
      status: session.status || "ready",
      pages: Number(session.pages ?? session.page_count ?? session.pageCount ?? 0) || 0,
      topics: [], // Not available in session data
      lastAccessed: new Date(session.created_at),
    }));
  }, [sessionsData, localSessions]);

  // Update pdfs state with synced data
  useEffect(() => {
    if (syncedPdfs.length > 0) {
      setPdfs(syncedPdfs);
    }
  }, [syncedPdfs]);

  const [currentPDF, setCurrentPDF] = useState<PDFFile | null>(initialPDF || null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showDetailButton, setShowDetailButton] = useState(false);
  const pdfChatCost = getFeatureCost("PDF_CHAT");
  const pdfSummaryCost = getFeatureCost("PDF_SUMMARY");
  const gateChat = useAiCanUse("PDF_CHAT");
  const gateSummary = useAiCanUse("PDF_SUMMARY");
  const consumeCredits = useConsumeAiCredits();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [pendingVoiceUrl, setPendingVoiceUrl] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const speechRecognitionRef = useRef<any>(null);
  const sendVoiceAfterStopRef = useRef(false);
  const discardVoiceRef = useRef(false);
  const conversationContainerRef = useRef<HTMLDivElement>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformHeights = ["h-2", "h-3", "h-4", "h-5", "h-6", "h-7", "h-8"] as const;
   //const studentId = useUserId() || "";

  // Keep local state in sync with parent when viewing a specific PDF chat.
  useEffect(() => {
    if (isIndividualChat) {
      setCurrentPDF(initialPDF || null);
      setMessages(initialMessages);
    }
  }, [isIndividualChat, initialPDF, initialMessages]);

  // Show detail button if there's exactly one assistant message from initial props
  useEffect(() => {
    if (isIndividualChat) {
      const assistantMessages = (initialMessages || []).filter(
        (m) => m.from === "assistant" && !!(m.content || "").trim(),
      );
      // Show after the first assistant response (the auto brief summary).
      setShowDetailButton(assistantMessages.length === 1);
      return;
    }

    if (initialMessages && initialMessages.length > 0) {
      const assistantMessages = initialMessages.filter(
        (m) => m.from === "assistant" && !!(m.content || "").trim(),
      );
      if (assistantMessages.length === 1) {
        setShowDetailButton(true);
      }
    }
  }, [initialMessages, isIndividualChat]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isRecording) return;
    if (pendingVoiceUrl && !text.trim()) {
      await sendRecordedVoice();
      return;
    }
    if (!text.trim()) return;

    if (gateChat.data?.allowed === false) {
      toast.error("Not enough AI credits", {
        description: `Each PDF chat reply costs ${pdfChatCost} credits. You have ${(gateChat.data.remaining ?? 0).toLocaleString()} credits remaining this month.`,
        duration: 7000,
      });
      return;
    }

    const userMessage: PDFMessage = {
      id: Date.now().toString(),
      content: text,
      from: "user",
      timestamp: new Date(),
      pdfId: currentPDF?.id,
      type: "question",
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = text;
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setStatus("submitted");
    setIsTyping(true);
    setShowDetailButton(false); // Hide button when user sends new message

    try {
      setStatus("streaming");
      const response = await chatWithPDFMutationFn({
        session_id: currentPDF?.id || "",
        question: messageText,
      });
      
      const aiMessage: PDFMessage = {
        id: (Date.now() + 1).toString(),
        content: response.answer || "I apologize, but I couldn't process your request at the moment.",
        from: "assistant",
        timestamp: new Date(),
        pdfId: currentPDF?.id,
        type: "summary",
      };
      setMessages((prev) => {
        const next = [...prev, aiMessage];
        const assistantCount = next.filter(
          (m) => m.from === "assistant" && !!(m.content || "").trim(),
        ).length;
        setShowDetailButton(assistantCount === 1);
        return next;
      });
      setStatus("ready");
      setIsTyping(false);
      
      consumeCredits.mutate({
        feature: "PDF_CHAT",
        creditsUsed: pdfChatCost,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      const parsed = parseUsageLimitError(error);
      toast.error(parsed.title, { description: parsed.description, duration: 7000 });
      const errorMessage: PDFMessage = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I encountered an error while processing your request. Please try again.",
        from: "assistant",
        timestamp: new Date(),
        pdfId: currentPDF?.id,
        type: "summary",
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStatus("ready");
      setIsTyping(false);
    }
  };

  const startRecording = async () => {
    try {
      if (isTyping) return;
      if (isRecording) return;

      // Clean up any previous pending voice URL
      if (pendingVoiceUrl) {
        URL.revokeObjectURL(pendingVoiceUrl);
        setPendingVoiceUrl(null);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());

        if (discardVoiceRef.current) {
          discardVoiceRef.current = false;
          setPendingVoiceUrl(null);
          setVoiceTranscript("");
          sendVoiceAfterStopRef.current = false;
          return;
        }

        const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setPendingVoiceUrl(url);
        
        // Initialize audio element for playback
        if (audioRef.current) {
          audioRef.current.src = url;
        }
        
        if (sendVoiceAfterStopRef.current) {
          sendVoiceAfterStopRef.current = false;
          setTimeout(() => {
            void sendRecordedVoice(url);
          }, 0);
        }
      };

      recorder.start();
      setRecordingSeconds(0);
      setIsRecording(true);
      setVoiceTranscript("");

      const Recognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (Recognition) {
        const recognition = new Recognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setVoiceTranscript(transcript.trim());
        };
        recognition.start();
        speechRecognitionRef.current = recognition;
      }
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Microphone permission is required to record voice.");
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === "inactive") return;
    recorder.stop();
    setIsRecording(false);
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      speechRecognitionRef.current = null;
    }
  };

  const sendRecordedVoice = async (forcedUrl?: string) => {
    const audioUrl = forcedUrl || pendingVoiceUrl;
    if (!audioUrl) return;
    if (!currentPDF?.id) return;

    if (gateChat.data?.allowed === false) {
      toast.error("Not enough AI credits", {
        description: `Each PDF chat reply costs ${pdfChatCost} credits. You have ${(gateChat.data.remaining ?? 0).toLocaleString()} credits remaining this month.`,
        duration: 7000,
      });
      return;
    }

    const normalizedTranscript =
      voiceTranscript.trim() || "Please process my voice message about this PDF.";

    const voiceMessage: PDFMessage = {
      id: Date.now().toString(),
      content: normalizedTranscript,
      from: "user",
      timestamp: new Date(),
      pdfId: currentPDF.id,
      type: "voice",
      audioUrl,
    };

    setMessages((prev) => [...prev, voiceMessage]);
    setStatus("submitted");
    setIsTyping(true);

    // Immediately clear the voice review state after sending
    setPendingVoiceUrl(null);
    setVoiceTranscript("");
    setIsPlayingVoice(false);

    try {
      setStatus("streaming");
      const response = await chatWithPDFMutationFn({
        session_id: currentPDF.id,
        question: normalizedTranscript,
      });

      const aiMessage: PDFMessage = {
        id: (Date.now() + 1).toString(),
        content: "", // Hide text content for voice responses
        from: "assistant",
        timestamp: new Date(),
        pdfId: currentPDF.id,
        type: "voice",
        ttsText: response.answer || "I received your voice message and processed it successfully.",
      };
      setMessages((prev) => [...prev, aiMessage]);
      setStatus("ready");
      consumeCredits.mutate({
        feature: "PDF_CHAT",
        creditsUsed: pdfChatCost,
      });
    } catch (error) {
      console.error("Failed to process voice message:", error);
      const parsed = parseUsageLimitError(error);
      toast.error(parsed.title, { description: parsed.description, duration: 7000 });
      const aiError: PDFMessage = {
        id: (Date.now() + 1).toString(),
        content: "I couldn't process your voice request right now. Please try again.",
        from: "assistant",
        timestamp: new Date(),
        pdfId: currentPDF.id,
        type: "error",
      };
      setMessages((prev) => [...prev, aiError]);
      setStatus("error");
    } finally {
      setIsTyping(false);
    }
  };

  const discardCurrentVoice = () => {
    if (
      isRecording &&
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      discardVoiceRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (pendingVoiceUrl) {
      URL.revokeObjectURL(pendingVoiceUrl);
      setPendingVoiceUrl(null);
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      speechRecognitionRef.current = null;
    }
    setVoiceTranscript("");
  };

  useEffect(() => {
    if (!isRecording) return;
    const t = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isRecording]);

  useEffect(() => {
    const host = conversationContainerRef.current;
    if (!host) return;
    const scrollable = host.querySelector('[role="log"]') as HTMLElement | null;
    if (!scrollable) return;
    requestAnimationFrame(() => {
      scrollable.scrollTo({ top: scrollable.scrollHeight, behavior: "smooth" });
    });
  }, [messages, isTyping]);

  const handleSummarizeInDetail = () => {
    const detailMessage = "Please provide a detailed summary of this PDF";
    setText(detailMessage);
    setShowDetailButton(false);
    
    // Auto-submit the detail request
    setTimeout(() => {
      const formEvent = new Event('submit', { cancelable: true }) as any;
      formEvent.preventDefault = () => {};
      if (textareaRef.current?.form) {
        textareaRef.current.form.requestSubmit();
      }
    }, 100);
  };

  const handleChat = (pdfId: string) => {
    if (isIndividualChat) {
      // If already in individual chat mode, just set the current PDF
      const pdf = pdfs.find((p) => p.id === pdfId);
      if (pdf) {
        setCurrentPDF(pdf);
        // Update last accessed
        setPdfs((prev) =>
          prev.map((p) =>
            p.id === pdfId ? { ...p, lastAccessed: new Date() } : p,
          ),
        );
      }
    } else {
      // Navigate to individual chat page
      window.location.href = `/student/${studentId}/pdf-summary/${pdfId}`;
    }
  };

  const handleDelete = (pdfId: string) => {
    setPdfs((prev) => prev.filter((p) => p.id !== pdfId));
    if (currentPDF?.id === pdfId) {
      setCurrentPDF(null);
    }
  };

  const handleDownload = (pdfId: string) => {
    // Simulate download
    console.log("Downloading PDF:", pdfId);
  };

  const handleBackToFiles = () => {
    if (isIndividualChat) {
      window.location.href = `/student/${studentId}/pdf-summary`;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  // Upload functionality
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(
      (file) => file.type === "application/pdf",
    );
    if (pdfFiles.length > 0) {
      handleFileUpload(pdfFiles);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

 const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: MAX_PDF_UPLOAD_SIZE_BYTES,
    multiple: true,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropRejected: () => {
      toast.error("Upload rejected", {
        description: `File too large for server limits (max ${MAX_PDF_UPLOAD_SIZE_LABEL}).`,
      });
    },
  });
    
  const handleFileUpload = async (files: File[]) => {
  const file = files[0];
  if (!file) return;
  
  // Frontend guard for current upload cap
  if (file.size > MAX_PDF_UPLOAD_SIZE_BYTES) {
    toast.error("Upload rejected", {
      description: `File too large for server limits (max ${MAX_PDF_UPLOAD_SIZE_LABEL}).`,
    });
    return;
  }

  const currentStudentId = studentId;
    if (!currentStudentId || currentStudentId === "undefined") {
      toast.error("Session issue", {
        description: "Please refresh the page and try again.",
      });
      return;
    }

    if (gateSummary.isLoading) {
      toast.info("Checking AI credits…", {
        description: "Please wait a moment before uploading.",
      });
      try {
        const refetchPromise = gateSummary.refetch?.() ?? Promise.resolve(gateSummary);
        await Promise.race([
          refetchPromise,
          new Promise((_res, rej) => setTimeout(() => rej(new Error('credit-check-timeout')), 3000)),
        ]);
      } catch (e) {
        toast.warning(
          "Proceeding without confirmed AI credits. Upload may be rejected if you lack credits.",
        );
      }
    }

    if (gateSummary.data?.allowed === false) {
      toast.error("Not enough AI credits", {
        description: `Each new PDF upload costs ${pdfSummaryCost} credits. You have ${(gateSummary.data.remaining ?? 0).toLocaleString()} credits remaining this month.`,
        duration: 7000,
      });
      return;
    }

  const fileId = `${file.name}-${Date.now()}`;
    setUploadProgress([{
      fileId,
      fileName: file.name,
      progress: 20,
      status: "uploading",
      error: null,
    }]);

    try {
      setUploadProgress(prev =>
        prev.map(p => p.fileId === fileId ? { ...p, progress: 60 } : p)
      );

      console.log("studentId before upload:", studentId);
    const response = await uploadPDFMutationFn({
      file,
    });

      setUploadProgress(prev =>
        prev.map(p => p.fileId === fileId
          ? { ...p, progress: 100, status: "complete" }
          : p
        )
      );

      setShowUploadModal(false);
      setUploadProgress([]);
      
      // Update the PDFs list to show new file
      const newPDF: PDFFile = {
        id: response.session_id,
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
        status: "ready",
        pages: 0,
        topics: [],
        lastAccessed: new Date(),
      };
      setPdfs(prev => [newPDF, ...prev.slice(0, 9)]); // Keep top 10
        
        // Store session in localStorage
        const existingSessions = JSON.parse(
          localStorage.getItem("pdf_sessions") || "[]"
        );
        existingSessions.unshift({
          session_id: response.session_id,
          file_name: file.name,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem(
          "pdf_sessions", 
          JSON.stringify(existingSessions.slice(0, 10))
        );

      consumeCredits.mutate({
        feature: "PDF_SUMMARY",
        creditsUsed: pdfSummaryCost,
      });

      router.push(`/student/${currentStudentId}/pdf-summary/${response.session_id}`);

    } catch (err) {
      console.error("Upload failed:", (err as any)?.response?.data || (err as any)?.message || err);
      const parsed = parseUsageLimitError(err);
      toast.error(parsed.title, { description: parsed.description, duration: 7000 });
      setUploadProgress(prev =>
        prev.map(p => p.fileId === fileId
          ? { ...p, status: "error", error: parsed.description }
          : p
        )
      );
    }
  };

  const handleCancelUpload = (fileId: string) => {
    setUploadProgress((prev) => prev.filter((p) => p.fileId !== fileId));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploading":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "complete":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "uploading":
        return "bg-blue-500";
      case "processing":
        return "bg-yellow-500";
      case "complete":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // If viewing a specific PDF chat (individual chat mode), show the chat interface
  if (isIndividualChat && currentPDF) {
    return (
      <div className="h-screen w-full flex flex-col overflow-hidden relative">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 border-b bg-linear-to-br from-primary/12 via-background to-muted/30" />
        <div aria-hidden className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-20 top-8 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />
        {/* Chat Header */}
        <div className="sticky top-0 z-100 flex items-center justify-between border-b bg-background p-4 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToFiles}
              className="flex items-center gap-2 hover:bg-muted/50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Files
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">{currentPDF.name}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {/* Temporarily commented out as requested */}
                  {/* <Badge variant="outline" className="text-xs">
                    {currentPDF.pages} pages
                  </Badge>
                  <span>•</span>
                  <span>{formatFileSize(currentPDF.size)}</span> */}
                  <span>•</span>
                  <span>{formatDate(currentPDF.uploadedAt)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-100">
                <DropdownMenuItem onClick={() => handleDownload(currentPDF.id)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </DropdownMenuItem>
                {onClearChatHistory && (
                  <DropdownMenuItem onClick={onClearChatHistory}>
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Clear Chat History
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleDelete(currentPDF.id)}
                  className="text-red-600"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Chat Messages */}
        <div ref={conversationContainerRef} className="flex-1 overflow-y-auto min-h-0">
          <AIConversation className="h-full">
            <AIConversationContent className="px-2 py-2 sm:px-4 md:px-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-primary/10 to-primary/5">
                    <FileText className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-3 text-foreground">
                    Chat with {currentPDF.name}
                  </h2>
                  <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
                    Ask questions about &ldquo;{currentPDF.name}&rdquo; and get
                    instant AI-powered answers, summaries, and insights from your document.
                  </p>
                  <div className="flex flex-col gap-3 max-w-sm w-full">
                    <div className="text-sm text-muted-foreground text-left">
                      <p className="font-medium mb-2">Try asking:</p>
                      <ul className="space-y-1 text-left">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                          &ldquo;Summarize the main points&rdquo;
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                          &ldquo;What are the key findings?&rdquo;
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                          &ldquo;Explain the methodology&rdquo;
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-6xl space-y-4 px-3 pb-8 sm:px-4">
                  {messages.map((message) => (
                    <PDFChatMessage
                      key={message.id}
                      message={message}
                      currentPDFName={currentPDF?.name}
                    />
                  ))}
                  {showDetailButton && !isTyping && messages.filter(m => m.from === "assistant").length === 1 && (
                    <div className="flex w-full justify-start mb-4">
                      <div className="flex items-end mr-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-linear-to-br from-primary to-violet-600 shadow-md">
                          <Bot className="w-5 h-5 text-primary-foreground" />
                        </div>
                      </div>
                      <div className="max-w-[min(92vw,52rem)] mr-12">
                        <Button
                          onClick={handleSummarizeInDetail}
                          variant="outline"
                          className="rounded-2xl px-4 py-2 text-sm border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                        >
                          Summarize in Detail
                        </Button>
                      </div>
                    </div>
                  )}
                  {isTyping && (
                    <div className="flex w-full justify-start mb-4">
                      <div className="flex items-end mr-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-linear-to-br from-primary to-violet-600 shadow-md">
                          <Bot className="w-5 h-5 text-primary-foreground" />
                        </div>
                      </div>
                      <div className="max-w-[min(92vw,52rem)] mr-12">
                        <div className="rounded-2xl border border-border/80 bg-card/90 px-4 py-3 text-base shadow-sm flex items-center gap-3 backdrop-blur-sm">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Reading your PDF…
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </AIConversationContent>
            <AIConversationScrollButton />
          </AIConversation>
        </div>

        {/* Margin studio — composer */}
        <div className="sticky bottom-0 z-50 border-t border-border/50 bg-linear-to-t from-background via-background/95 to-background/70 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-6xl px-3 pb-4 pt-3 sm:px-4">
            <p className="mb-2 text-center text-[11px] text-muted-foreground">
              Each reply costs {pdfChatCost} AI credits
              {typeof gateChat.data?.remaining === "number"
                ? ` · ${gateChat.data.remaining.toLocaleString()} credits left this month`
                : ""}
            </p>
            <div className="mb-3 flex flex-wrap justify-center gap-2">
              {PDF_QUICK_PROMPTS.map(({ label, text, icon: Icon }) => (
                <Button
                  key={label}
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isTyping || gateChat.data?.allowed === false}
                  className="h-8 gap-1.5 rounded-full border border-border/60 bg-muted/50 text-xs font-medium shadow-sm hover:bg-primary/10 hover:border-primary/30"
                  onClick={() => {
                    setText(text);
                    textareaRef.current?.focus();
                  }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                  {label}
                </Button>
              ))}
            </div>
            <div className="relative rounded-[1.35rem] p-px shadow-xl ring-1 ring-primary/15 bg-linear-to-br from-primary/35 via-violet-500/25 to-transparent">
              <div className="rounded-[1.3rem] bg-card/95 backdrop-blur-md">
                <AIInput
                  onSubmit={handleSubmit}
                  className="divide-y-0 overflow-visible rounded-[1.3rem] border-0 bg-transparent shadow-none"
                >
                  <div className="flex w-full items-end gap-1 px-2 pb-2 pt-2">
                    <div className="hidden sm:flex w-1 shrink-0 self-stretch rounded-full bg-linear-to-b from-primary via-violet-500 to-transparent opacity-80" aria-hidden />
                    {(isRecording || pendingVoiceUrl) ? (
                      <div className="min-h-[60px] flex-1 flex items-center px-3 py-2">
                        {isRecording ? (
                          <div className="flex flex-1 items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                              <span className="text-sm text-muted-foreground">
                                Recording… {recordingSeconds}s
                              </span>
                            </div>
                            <div className="flex h-8 flex-1 items-center justify-center gap-1">
                              {Array.from({ length: 20 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-1 rounded-full bg-primary/80 animate-pulse ${waveformHeights[i % waveformHeights.length]}`}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Voice note ready — tap send to ask with audio context
                          </div>
                        )}
                      </div>
                    ) : (
                      <AIInputTextarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={`Ask anything about this document…`}
                        disabled={isTyping || gateChat.data?.allowed === false}
                        className="min-h-[56px] max-h-[140px] flex-1 resize-none overflow-y-auto border-0 bg-transparent px-2 py-2 text-[15px] leading-relaxed"
                        ref={textareaRef}
                      />
                    )}
                    <AIInputToolbar className="shrink-0 flex-col justify-end gap-1 border-0 p-0">
                      {(isRecording || pendingVoiceUrl) && (
                        <>
                          {isRecording && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={isTyping}
                              onClick={stopRecording}
                              className="h-9 w-9"
                              aria-label="Stop recording"
                            >
                              <Square size={16} />
                            </Button>
                          )}
                          {pendingVoiceUrl && !isRecording && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={isTyping}
                              onClick={() => {
                                if (audioRef.current) {
                                  if (isPlayingVoice) {
                                    audioRef.current.pause();
                                    setIsPlayingVoice(false);
                                  } else {
                                    void audioRef.current.play();
                                    setIsPlayingVoice(true);
                                  }
                                }
                              }}
                              className="h-9 w-9"
                              aria-label={isPlayingVoice ? "Pause playback" : "Play recording"}
                            >
                              {isPlayingVoice ? <Pause size={16} /> : <Play size={16} />}
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isTyping}
                            onClick={discardCurrentVoice}
                            className="h-9 w-9"
                            aria-label="Discard voice note"
                          >
                            <TrashIcon size={16} />
                          </Button>
                        </>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-primary"
                        disabled={
                          isTyping ||
                          gateChat.data?.allowed === false ||
                          isRecording ||
                          !!pendingVoiceUrl
                        }
                        onClick={() => void startRecording()}
                        aria-label="Record voice question"
                      >
                        <Mic size={18} />
                      </Button>
                      <AIInputSubmit
                        status={status}
                        disabled={
                          isTyping ||
                          gateChat.data?.allowed === false ||
                          (!text.trim() && !pendingVoiceUrl) ||
                          isRecording
                        }
                        className="h-10 w-10 rounded-xl"
                        aria-label="Send message"
                      />
                    </AIInputToolbar>
                  </div>
                </AIInput>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Audio Element for Voice Playback */}
        {pendingVoiceUrl && (
          <audio
            ref={audioRef}
            src={pendingVoiceUrl}
            onEnded={() => setIsPlayingVoice(false)}
            onError={() => setIsPlayingVoice(false)}
          />
        )}
      </div>
    );
  }

  // Main layout - following the roadmap pattern
  return (
    <>
      <div className="min-h-full w-full pb-16 relative">
        <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20 md:text-center">
            <Badge variant="secondary" className="mb-4 rounded-full px-3 py-1 text-xs font-medium">
              <FileText className="mr-1 inline h-3.5 w-3.5" />
              Student hub
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">PDF Summary</h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
              Upload your PDF files and chat with AI to get instant summaries and insights.
            </p>
            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-3 text-center md:gap-6">
              <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
                <div className="text-2xl font-semibold tabular-nums md:text-3xl">AI</div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                  Powered
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
                <div className="text-2xl font-semibold tabular-nums md:text-3xl">{pdfs.length}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                  PDF Uploads
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
                <div className="text-2xl font-semibold tabular-nums md:text-3xl">Chat</div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                  Summary
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="mx-auto max-w-6xl px-4 pt-10">

        {/* Main Content - PDF Upload Card in Center */}
        <div className="flex flex-1 items-center justify-center w-full">
          <div className="w-full max-w-lg bg-card text-card-foreground rounded-2xl shadow-2xl px-6 py-8 flex flex-col items-center border border-border">
            <div className="flex flex-col items-center justify-center w-full">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-center">
                Upload PDF
              </h3>
              <p className="text-muted-foreground text-center mb-6">
                Start a new conversation with your PDF documents
              </p>
              <Button
                onClick={() => setShowUploadModal(true)}
                className="w-full"
                size="lg"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Last PDF Chats Section */}
        <div className="w-full max-w-6xl mx-auto px-2 pb-10 mt-10">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              Recent PDF Chats
            </h2>
          </div>
          <div className="w-16 h-1 rounded-full bg-primary/20 mb-6" />
          <LastPDFChats onChat={handleChat} />
        </div>
        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload PDF Files
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload Area */}
            <Card
              className={`border-2 border-dashed transition-colors ${isDragActive
                  ? "border-primary bg-primary/5"
                  : isDragReject
                    ? "border-red-500 bg-red-50"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
            >
              <CardContent className="p-6">
                <div
                  {...getRootProps()}
                  className="flex flex-col items-center justify-center space-y-4 cursor-pointer"
                >
                  <input {...getInputProps()} />
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">
                      {isDragActive
                        ? "Drop PDF files here"
                        : "Upload PDF files"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Drag and drop PDF files here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum file size: 10MB per file
                    </p>
                  </div>
                  <Button variant="outline" className="mt-2">
                    Choose Files
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upload Progress */}
            {uploadProgress.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Upload Progress</h4>
                  <div className="space-y-3">
                    {uploadProgress.map((progress) => (
                      <div
                        key={progress.fileId}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="shrink-0">
                          {getStatusIcon(progress.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">
                              {progress.fileName}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${getStatusColor(progress.status)}`}
                              >
                                {progress.status}
                              </Badge>
                              {progress.status === "uploading" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleCancelUpload(progress.fileId)
                                  }
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <Progress value={progress.progress} className="h-2" />
                          {progress.error && (
                            <p className="text-xs text-red-500 mt-1">
                              {progress.error}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PDFSummaryChat;
