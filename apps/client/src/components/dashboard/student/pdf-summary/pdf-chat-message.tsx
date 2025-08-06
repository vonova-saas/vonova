"use client";

import { PDFMessage } from "./types";
import { AIResponse } from "@/components/ui/ai/ai-components/response";
import { FileText } from "lucide-react";

interface PDFChatMessageProps {
  message: PDFMessage;
  currentPDFName?: string;
}

export default function PDFChatMessage({
  message,
  currentPDFName,
}: PDFChatMessageProps) {
  const isUser = message.from === "user";
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getMessageIcon = () => {
    if (isUser) {
      return (
        <div className="flex items-end mr-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/avatars/avatar1.avif"
            alt="User"
            className="w-10 h-10 rounded-full border"
          />
        </div>
      );
    } else {
      return (
        <div className="flex items-end mr-2">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border">
            {/* OpenAI swirl SVG icon */}
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
      );
    }
  };

  const getMessageTypeBadge = () => {
    if (!isUser && message.type !== "text") {
      const typeColors = {
        summary: "bg-blue-100 text-blue-700 border-blue-200",
        question: "bg-green-100 text-green-700 border-green-200",
        error: "bg-red-100 text-red-700 border-red-200",
      };

      return (
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span
            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border ${typeColors[message.type] || ""}`}
          >
            {message.type.charAt(0).toUpperCase() + message.type.slice(1)}
          </span>
          {currentPDFName && (
            <span className="text-xs text-muted-foreground">
              from {currentPDFName}
            </span>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      {!isUser && getMessageIcon()}
      <div className={`max-w-[70%] ${isUser ? "ml-8" : "mr-8"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-base ${isUser ? "bg-white text-black" : "bg-neutral-900 text-white"} shadow-sm`}
        >
          {getMessageTypeBadge()}
          <AIResponse>{message.content}</AIResponse>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted/20">
            <span className="text-xs text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
            {message.pdfId && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="w-3 h-3" />
                <span>PDF Reference</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {isUser && getMessageIcon()}
    </div>
  );
}
