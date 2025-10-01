"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, Clock, ArrowRight } from "lucide-react";
import { mockPDFFiles, mockMessages } from "./fake-data";
import useStudentId from "@/hooks/student/use-student-id";

interface LastPDFChatsProps {
  onChat: (pdfId: string) => void;
}

export default function LastPDFChats({ onChat }: LastPDFChatsProps) {
  const studentId = useStudentId();

  // Get PDFs that have been accessed recently (have lastAccessed date)
  const recentPDFs = mockPDFFiles
    .filter((pdf) => pdf.lastAccessed)
    .sort(
      (a, b) =>
        (b.lastAccessed?.getTime() || 0) - (a.lastAccessed?.getTime() || 0),
    )
    .slice(0, 3); // Only show 3 most recent

  // Get recent messages for each PDF
  const getRecentMessages = (pdfId: string) => {
    return mockMessages
      .filter((msg) => msg.pdfId === pdfId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 2);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const handleViewAll = () => {
    window.location.href = `/${studentId}/pdf-summary/last-pdf-chats`;
  };

  if (recentPDFs.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent PDF Chats</h3>
        <Button variant="ghost" size="sm" onClick={handleViewAll} className="cursor-pointer">
          View All
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentPDFs.map((pdf) => {
          const recentMessages = getRecentMessages(pdf.id);
          const lastMessage = recentMessages[0];

          return (
            <Card
              key={pdf.id}
              className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20 cursor-pointer"
              onClick={() => onChat(pdf.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold truncate">
                        {pdf.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {pdf.pages} pages
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(pdf.lastAccessed!)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {lastMessage && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{lastMessage.from}</span>
                      <span>•</span>
                      <span>{formatTime(lastMessage.timestamp)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {truncateText(lastMessage.content, 100)}
                    </p>
                  </div>
                )}

                {recentMessages.length > 1 && (
                  <div className="mt-2 pt-2 border-t border-muted/20">
                    <p className="text-xs text-muted-foreground">
                      +{recentMessages.length - 1} more messages
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
