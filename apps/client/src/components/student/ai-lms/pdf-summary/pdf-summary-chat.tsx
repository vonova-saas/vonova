"use client";
import { toast } from "sonner";
import { useState, useRef, useCallback } from "react";
import { useUserId } from "@/hooks";
import { useDropzone } from "react-dropzone";
import {
  AIInput,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
  AIInputButton,
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
  PlusIcon,
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
import { uploadPDFMutationFn } from "@/services/student/lms-ai/pdf-summary/pdf.api";

interface PDFSummaryChatProps {
  initialPDF?: PDFFile | null;
  initialMessages?: PDFMessage[];
  isIndividualChat?: boolean;
  studentId?: string;
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
}: PDFSummaryChatProps) {
    const rawId = useUserId();
    const studentId = rawId && rawId !== "undefined" ? rawId : "";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
// const studentId = useUserId() || "";

  const generateFakeResponse = () => {
    const responseIndex = Math.floor(Math.random() * fakeResponses.length);
    return fakeResponses[responseIndex];
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setStatus("submitted");
    setIsTyping(true);

    setTimeout(() => {
      setStatus("streaming");
      const aiResponseData = generateFakeResponse();
      const aiMessage: PDFMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponseData.content,
        from: "assistant",
        timestamp: new Date(),
        pdfId: currentPDF?.id,
        type: "summary",
      };
      setMessages((prev) => [...prev, aiMessage]);
      setStatus("ready");
      setIsTyping(false);
    }, 2000);
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
  }, []);

 const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: true,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropRejected: () => {
      alert("File too large. Maximum size is 5MB.");
    },
  });
    
  const handleFileUpload = async (files: File[]) => {
  const file = files[0];
  if (!file) return;

  const currentStudentId = studentId ||
    window.location.pathname.split('/')[2];

  if (!currentStudentId || currentStudentId === 'undefined') {
    alert("Please refresh the page and try again.");
    return;
  }

  const fileId = `${file.name}-${Date.now()}`;
    if (!studentId) {
      //toast.error("Session expired. Please refresh the page.");
      alert("Session expired. Please refresh the page.");
      return;
    }
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
    user_id: currentStudentId,
    auto_summarize: true,
    language: "en",
  });

      setUploadProgress(prev =>
        prev.map(p => p.fileId === fileId
          ? { ...p, progress: 100, status: "complete" }
          : p
        )
      );

      setTimeout(() => {
        setShowUploadModal(false);
        setUploadProgress([]);
        
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
        
        if (studentId && response?.session_id) {
          window.location.href = `/student/${studentId}/pdf-summary/${response.session_id}`;
        }
      }, 2000);

    } catch (err) {
      console.error("Upload failed:", err);
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
      <div
        className="h-full w-full flex flex-col overflow-hidden relative"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)",
          backgroundSize: "18px 18px",
        }}
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0 z-10">
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
        <div className="h-[calc(100vh-280px)] overflow-hidden">
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
        <div className="absolute bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg flex flex-col-reverse items-stretch p-4 gap-0">
          <AIInput onSubmit={handleSubmit} className="border shadow-sm w-full">
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
            <AIInputToolbar>
              <AIInputTools>
                <AIInputButton
                  disabled={isTyping}
                  className="hover:bg-accent/50"
                >
                  <PlusIcon size={16} />
                </AIInputButton>
              </AIInputTools>
              <AIInputSubmit
                disabled={!text.trim() || isTyping}
                status={status}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <SendIcon size={16} />
              </AIInputSubmit>
            </AIInputToolbar>
          </AIInput>
        </div>
      </div>
    );
  }

  // Main layout - following the roadmap pattern
  return (
    <>
      <div
        className="h-full w-full min-h-screen flex flex-col items-center justify-center overflow-hidden relative bg-background"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)",
          backgroundSize: "18px 18px",
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto pt-8 pb-4">
          <FileText className="w-10 h-10 md:w-12 md:h-12 text-primary mb-3" />
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-1 text-center">
            PDF Summary & Chat
          </h1>
          <p className="text-base md:text-lg text-muted-foreground font-normal text-center mb-2">
            Upload your PDF files and chat with AI to get instant summaries,
            answers, and insights from your documents.
          </p>
          <div className="w-16 h-1 rounded-full bg-primary/20 mx-auto mb-2" />
        </div>

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
