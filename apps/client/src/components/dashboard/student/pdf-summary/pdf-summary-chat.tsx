"use client";

import { useState, useRef } from "react";
import {
  AIInput,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
  AIInputButton,
  AIInputSubmit,
  AIInputModelSelect,
  AIInputModelSelectContent,
  AIInputModelSelectItem,
  AIInputModelSelectTrigger,
  AIInputModelSelectValue,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PDFFile, PDFMessage, UploadProgress } from "./types";
import { mockPDFFiles, mockMessages, topics } from "./fake-data";
import PDFUpload from "./pdf-upload";
import PDFSummaryList from "./pdf-summary-list";
import PDFChatMessage from "./pdf-chat-message";

const models = [
  { id: "gpt-4", name: "GPT-4", description: "Most capable model" },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "Fast and efficient",
  },
  { id: "claude-2", name: "Claude 2", description: "Advanced reasoning" },
  {
    id: "claude-instant",
    name: "Claude Instant",
    description: "Quick responses",
  },
];

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

const AIAssistantChat = () => {
  const [messages, setMessages] = useState<PDFMessage[]>(mockMessages);
  const [text, setText] = useState<string>("");
  const [model, setModel] = useState<string>(models[0].id);
  const [status, setStatus] = useState<
    "submitted" | "streaming" | "ready" | "error"
  >("ready");
  const [isTyping, setIsTyping] = useState(false);
  const [currentBranch, setCurrentBranch] = useState(0);
  const [pdfs, setPdfs] = useState<PDFFile[]>(mockPDFFiles);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [currentPDF, setCurrentPDF] = useState<PDFFile | null>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const clearConversation = () => {
    setMessages([]);
    setCurrentBranch(0);
  };

  const handleFileUpload = (files: File[]) => {
    files.forEach((file, index) => {
      const progress: UploadProgress = {
        fileId: `upload-${Date.now()}-${index}`,
        progress: 0,
        status: "uploading",
      };

      setUploadProgress((prev) => [...prev, progress]);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileId === file.name
              ? { ...p, progress: Math.min(p.progress + 10, 100) }
              : p,
          ),
        );
      }, 200);

      // Simulate upload completion
      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileId === file.name
              ? { ...p, status: "processing", progress: 100 }
              : p,
          ),
        );

        // Simulate processing completion
        setTimeout(() => {
          const newPDF: PDFFile = {
            id: `pdf-${Date.now()}-${index}`,
            name: file.name,
            size: file.size,
            uploadedAt: new Date(),
            status: "ready",
            pages: Math.floor(Math.random() * 50) + 10,
            topics: topics.slice(
              Math.floor(Math.random() * 5) + 1,
              Math.floor(Math.random() * 8) + 1,
            ),
          };

          setPdfs((prev) => [...prev, newPDF]);
          setUploadProgress((prev) =>
            prev.filter((p) => p.fileId !== file.name),
          );
        }, 3000);
      }, 2000);
    });
  };

  const handleCancelUpload = (fileId: string) => {
    setUploadProgress((prev) => prev.filter((p) => p.fileId !== fileId));
  };

  const handleChat = (pdfId: string) => {
    const pdf = pdfs.find((p) => p.id === pdfId);
    if (pdf) {
      setCurrentPDF(pdf);
      setActiveTab("chat");
      // Update last accessed
      setPdfs((prev) =>
        prev.map((p) =>
          p.id === pdfId ? { ...p, lastAccessed: new Date() } : p,
        ),
      );
    }
  };

  const handleDelete = (pdfId: string) => {
    setPdfs((prev) => prev.filter((p) => p.id !== pdfId));
    if (currentPDF?.id === pdfId) {
      setCurrentPDF(null);
      setActiveTab("files");
    }
  };

  const handleDownload = (pdfId: string) => {
    // Simulate download
    console.log("Downloading PDF:", pdfId);
  };

  const handleRename = (pdfId: string, newName: string) => {
    setPdfs((prev) =>
      prev.map((p) => (p.id === pdfId ? { ...p, name: newName } : p)),
    );
  };

  const handleUpload = () => {
    setActiveTab("upload");
  };

  const handleBackToFiles = () => {
    setCurrentPDF(null);
    setActiveTab("files");
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }}>
      {/* Header */}
      {/* <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold">PDF Summary & Chat</h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Powered by {models.find((m) => m.id === model)?.name}
              </p>
              <Badge variant="secondary" className="text-xs">
                {pdfs.length} PDFs
              </Badge>
              {currentPDF && (
                <Badge variant="outline" className="text-xs">
                  {currentPDF.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AIInputModelSelect onValueChange={setModel} value={model}>
            <AIInputModelSelectTrigger className="w-40">
              <AIInputModelSelectValue />
            </AIInputModelSelectTrigger>
            <AIInputModelSelectContent>
              {models.map((model) => (
                <AIInputModelSelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col">
                    <span>{model.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.description}
                    </span>
                  </div>
                </AIInputModelSelectItem>
              ))}
            </AIInputModelSelectContent>
          </AIInputModelSelect>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearConversation}
            disabled={messages.length === 0}
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              PDF Files
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="h-full mt-0">
            <div className="h-full flex flex-col">
              {/* Chat Header */}
              {currentPDF && (
                <div className="flex items-center justify-between p-4 border-b bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToFiles}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Files
                    </Button>
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="font-medium">{currentPDF.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {currentPDF.pages} pages
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDownload(currentPDF.id)}
                      >
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
              )}

              {/* Chat Messages */}
              <div className="h-[calc(100vh-280px)] overflow-hidden">
                <AIConversation className="h-full">
                  <AIConversationContent>
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">
                          {currentPDF
                            ? `Chat with ${currentPDF.name}`
                            : "Start a PDF conversation"}
                        </h2>
                        <p className="text-muted-foreground max-w-md mb-6">
                          {currentPDF
                            ? `Ask questions about "${currentPDF.name}" and get instant AI-powered answers and summaries.`
                            : "Upload a PDF file and start chatting with AI to get instant summaries and answers!"}
                        </p>
                        {!currentPDF && (
                          <Button onClick={() => setActiveTab("files")}>
                            Browse PDFs
                          </Button>
                        )}
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
                                <div className="flex items-end mr-2">
                                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border">
                                    <svg
                                      width="28"
                                      height="28"
                                      viewBox="0 0 40 40"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <g>
                                        <path
                                          d="M20.5 6.5c-3.5-2-8 0-9.5 3.5l-7 12c-2 3.5 0 8 3.5 9.5l12 7c3.5 2 8 0 9.5-3.5l7-12c2-3.5 0-8-3.5-9.5l-12-7z"
                                          fill="#fff"
                                        />
                                        <path
                                          d="M20.5 6.5c-3.5-2-8 0-9.5 3.5l-7 12c-2 3.5 0 8 3.5 9.5l12 7c3.5 2 8 0 9.5-3.5l7-12c2-3.5 0-8-3.5-9.5l-12-7z"
                                          stroke="#000"
                                          strokeWidth="2"
                                        />
                                      </g>
                                    </svg>
                                  </div>
                                </div>
                                <div className="max-w-[70%] mr-8">
                                  <div className="rounded-2xl px-4 py-3 text-base bg-neutral-900 text-white shadow-sm flex items-center gap-2">
                                    <div className="flex space-x-1">
                                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                      <div
                                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                        style={{ animationDelay: "0.1s" }}
                                      ></div>
                                      <div
                                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                        style={{ animationDelay: "0.2s" }}
                                      ></div>
                                    </div>
                                    <span className="text-sm text-gray-200">
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
                <AIInput
                  onSubmit={handleSubmit}
                  className="border shadow-sm w-full"
                >
                  <AIInputTextarea
                    onChange={(e) => setText(e.target.value)}
                    value={text}
                    placeholder={
                      currentPDF
                        ? `Ask about ${currentPDF.name}...`
                        : "Upload a PDF to start chatting..."
                    }
                    disabled={isTyping || !currentPDF}
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
                      <AIInputButton
                        disabled={isTyping}
                        className="hover:bg-accent/50"
                        onClick={() => setActiveTab("files")}
                      >
                        <FileText size={16} />
                        <span>Browse PDFs</span>
                      </AIInputButton>
                    </AIInputTools>
                    <AIInputSubmit
                      disabled={!text.trim() || isTyping || !currentPDF}
                      status={status}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <SendIcon size={16} />
                    </AIInputSubmit>
                  </AIInputToolbar>
                </AIInput>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="files" className="h-full mt-0 overflow-auto">
            <div className="p-6">
              <PDFSummaryList
                pdfs={pdfs}
                onChat={handleChat}
                onDelete={handleDelete}
                onDownload={handleDownload}
                onRename={handleRename}
                onUpload={handleUpload}
              />
            </div>
          </TabsContent>

          <TabsContent value="upload" className="h-full mt-0 overflow-auto">
            <div className="p-6">
              <PDFUpload
                onFileUpload={handleFileUpload}
                uploadProgress={uploadProgress}
                onCancelUpload={handleCancelUpload}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIAssistantChat;
