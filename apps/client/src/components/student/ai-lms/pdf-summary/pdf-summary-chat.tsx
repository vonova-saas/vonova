"use client";
import { toast } from "sonner";
import { useState, useRef, useCallback, useEffect } from "react";
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
  AIBranch,
  AIBranchMessages,
  AIBranchSelector,
  AIBranchPrevious,
  AIBranchNext,
} from "@/components/ui/ai/ai-components/branch";
import {
  TrashIcon,
  FileText,
  Upload,
  SendIcon,
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
  Volume2,
  Square,
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
import { uploadPDFMutationFn, chatWithPDFMutationFn } from "@/services/student/lms-ai/pdf-summary/pdf.api";

interface PDFSummaryChatProps {
  initialPDF?: PDFFile | null;
  initialMessages?: PDFMessage[];
  isIndividualChat?: boolean;
  studentId?: string;
  onClearChatHistory?: () => void;
}

const fakeResponses = [
  {
    content:
      "Based on the PDF content, here's what I found:\n\n**Key Points:**\n- Point 1: Important information from the document\n- Point 2: Another significant finding\n- Point 3: Additional insights\n\n**Summary:** The document covers [topic] and provides detailed information about [specific aspects]. Would you like me to elaborate on any particular section?",
  },
  {
    content:
      "I've analyzed the PDF and here are the main takeaways:\n\n1. **Primary Topic**: [Main subject]\n2. **Key Concepts**: [Important ideas]\n3. **Practical Applications**: [How to use this information]\n\nThe document is well-structured and provides comprehensive coverage of the subject matter. Is there a specific aspect you'd like me to focus on?",
  },
  {
    content:
      "From reviewing your PDF, I can provide the following insights:\n\n**Document Overview:**\n- Type: [Document type]\n- Length: [Number of pages]\n- Main Focus: [Primary topic]\n\n**Critical Information:**\n- [Important point 1]\n- [Important point 2]\n- [Important point 3]\n\nWould you like me to dive deeper into any particular section or answer specific questions about the content?",
  },
];
 

export default function PDFSummaryChat({
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
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<PDFMessage[]>(initialMessages);
  const [status, setStatus] = useState<
    "submitted" | "streaming" | "ready" | "error"
  >("ready");
  const [isTyping, setIsTyping] = useState(false);
  const [currentBranch, setCurrentBranch] = useState(0);
  const [pdfs, setPdfs] = useState<PDFFile[]>(mockPDFFiles);
  const [currentPDF, setCurrentPDF] = useState<PDFFile | null>(initialPDF || null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showDetailButton, setShowDetailButton] = useState(false);
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
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);
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

  const generateFakeResponse = () => {
    const responseIndex = Math.floor(Math.random() * fakeResponses.length);
    return fakeResponses[responseIndex];
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isRecording) return;
    if (!text.trim()) return;

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
      setMessages((prev) => [...prev, aiMessage]);
      setStatus("ready");
      setIsTyping(false);
      
      // Show detail button after first assistant response if this is the first exchange
      if (messages.filter(m => m.from === "assistant").length === 0) {
        setShowDetailButton(true);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Check for AWS/S3 configuration errors
const uploadErrorMessage = (error as any)?.message || (error as any)?.response?.data?.message || (error as any)?.toString();      if (uploadErrorMessage && (uploadErrorMessage.includes('AWS Access Key') || uploadErrorMessage.includes('S3') || uploadErrorMessage.includes('credentials') || uploadErrorMessage.includes('Failed to upload file to S3'))) {
        alert('Server Error: Storage configuration (S3) is invalid. Please contact the backend team.');
      } else {
        alert('Upload failed. Please try again.');
      }
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
    } catch (error) {
      console.error("Failed to process voice message:", error);
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
    maxSize: 2 * 1024 * 1024,
    multiple: true,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropRejected: () => {
      alert("File too large for server limits (Max 2MB)");
    },
  });
    
  const handleFileUpload = async (files: File[]) => {
  const file = files[0];
  if (!file) return;
  
  // Strict 2MB frontend check
  if (file.size > 2 * 1024 * 1024) {
    alert("File too large for server limits (Max 2MB)");
    return;
  }

  const currentStudentId = studentId;
  if (!currentStudentId || currentStudentId === "undefined") {
    alert("Please refresh the page and try again.");
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
      
      // Force state refresh to show new file in View All/Recent Chats
      window.location.href = `/student/${currentStudentId}/pdf-summary`;
        
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
        
        if (currentStudentId && response?.session_id) {
          window.location.href = `/student/${currentStudentId}/pdf-summary/${response.session_id}?fresh=1`;
        }

    } catch (err) {
      console.error("Upload failed:", (err as any)?.response?.data || (err as any)?.message || err);
      setUploadProgress(prev =>
        prev.map(p => p.fileId === fileId
          ? { ...p, status: "error", error: "Upload failed, please try again" }
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
        <div className="sticky top-0 z-[100] flex items-center justify-between p-4 border-b bg-background flex-shrink-0">
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
                  <Badge variant="outline" className="text-xs">
                    {currentPDF.pages} pages
                  </Badge>
                  <span>•</span>
                  <span>{formatFileSize(currentPDF.size)}</span>
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
              <DropdownMenuContent align="end">
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
            <AIConversationContent>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mb-6">
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
                <AIBranch
                  defaultBranch={currentBranch}
                  onBranchChange={setCurrentBranch}
                >
                  <AIBranchMessages>
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <PDFChatMessage
                          key={message.id}
                          message={message}
                          currentPDFName={currentPDF?.name}
                        />
                      ))}
                      {/* Summarize in Detail Button */}
                      {showDetailButton && !isTyping && messages.filter(m => m.from === "assistant").length === 1 && (
                        <div className="flex w-full justify-start mb-4">
                          <div className="flex items-end mr-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-blue-200">
                              <Bot className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="max-w-[75%] mr-12">
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
                      {/* Typing indicator */}
                      {isTyping && (
                        <div className="flex w-full justify-start mb-4">
                          <div className="flex items-end mr-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-blue-200">
                              <Bot className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="max-w-[75%] mr-12">
                            <div className="rounded-2xl px-4 py-3 text-base bg-card text-card-foreground border shadow-sm flex items-center gap-3">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                <div
                                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                AI is analyzing PDF...
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </AIBranchMessages>
                  <AIBranchSelector from="assistant">
                    <AIBranchPrevious />
                    <AIBranchNext />
                  </AIBranchSelector>
                </AIBranch>
              )}
            </AIConversationContent>
            <AIConversationScrollButton />
          </AIConversation>
        </div>

        {/* Chat Input */}
        <div className="sticky bottom-2 z-[100] left-0 right-0 border-t bg-background shadow-lg flex flex-col-reverse items-stretch p-3 gap-0 mx-4">
          <AIInput onSubmit={handleSubmit} className="border shadow-sm w-full">
            {(isRecording || pendingVoiceUrl) ? (
              <div className="min-h-[60px] w-full flex items-center px-4 py-3">
                {isRecording ? (
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-muted-foreground">Recording… {recordingSeconds}s</span>
                    </div>
                    {/* Waveform Animation */}
                    <div className="flex-1 h-8 flex items-center justify-center gap-1">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-primary rounded-full animate-pulse"
                          style={{
                            height: `${Math.random() * 100}%`,
                            animationDelay: `${i * 0.05}s`,
                            animationDuration: '0.5s'
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">
                      Voice note ready to send
                    </div>
                    {/* Hide transcript during review state */}
                  </div>
                )}
              </div>
            ) : (
              <AIInputTextarea
                onChange={(e) => setText(e.target.value)}
                value={text}
                placeholder={`Ask about ${currentPDF.name}...`}
                disabled={isTyping}
                className="min-h-[60px] max-h-[120px] resize-none w-full"
                style={{ overflowY: "auto" }}
                ref={textareaRef}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const form = e.currentTarget.form;
                    if (form) form.requestSubmit();
                  }
                }}
              />
            )}
            <AIInputToolbar>
              {(isRecording || pendingVoiceUrl) && (
                <>
                  {isRecording && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isTyping}
                      onClick={stopRecording}
                      className="mr-1"
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
                            audioRef.current.play();
                            setIsPlayingVoice(true);
                          }
                        }
                      }}
                      className="mr-1"
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
                    className="mr-2"
                  >
                    <TrashIcon size={16} />
                  </Button>
                </>
              )}
              <AIInputSubmit
                disabled={isTyping}
                status={status}
                className="bg-primary hover:bg-primary/90 text-primary-foreground mr-1"
                onClick={(e) => {
                  if (isRecording) {
                    e.preventDefault();
                    sendVoiceAfterStopRef.current = true;
                    stopRecording();
                    return;
                  }
                  if (pendingVoiceUrl) {
                    e.preventDefault();
                    void sendRecordedVoice();
                    return;
                  }
                  if (!text.trim()) {
                    e.preventDefault();
                    startRecording();
                  }
                }}
              >
                {text.trim() || isRecording || pendingVoiceUrl ? (
                  <SendIcon size={16} />
                ) : (
                  <Mic size={16} />
                )}
              </AIInputSubmit>
            </AIInputToolbar>
          </AIInput>
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
                <div className="text-2xl font-semibold tabular-nums md:text-3xl">PDF</div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                  Upload
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
                        <div className="flex-shrink-0">
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
