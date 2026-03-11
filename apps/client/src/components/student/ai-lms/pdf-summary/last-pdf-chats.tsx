"use client";

import { useQuery } from "@tanstack/react-query";
import { getSessionsQueryFn } from "@/services/student/lms-ai/pdf-summary/pdf.api";
import { useUserId } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, Clock, ArrowRight } from "lucide-react";
import { GetSessionsResponse } from "@/types/api/student/lms-ai/pdf-summary/pdf.type";

interface LastPDFChatsProps {
  onChat: (pdfId: string) => void;
}

export default function LastPDFChats({ onChat }: LastPDFChatsProps) {
  const rawId = useUserId();
  const studentId = rawId && rawId !== "undefined" ? rawId : "";

  const { data, isLoading } = useQuery<GetSessionsResponse>({
    queryKey: ["pdf-sessions"],
    queryFn: getSessionsQueryFn,
    enabled: !!studentId,
  });

  const sessions = data?.sessions || [];

  const handleViewAll = () => {
    if (!studentId) return;
    window.location.href = `/student/${studentId}/pdf-summary/last-pdf-chats`;
  };

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading...</p>;
  /*const handleViewAll = () => {
    window.location.href = `/student/${studentId}/pdf-summary/last-pdf-chats`;
  };*/


  if (sessions.length === 0) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent PDF Chats</h3>
          <Button variant="ghost" size="sm" onClick={handleViewAll} className="cursor-pointer">
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          No PDF sessions yet. Upload a PDF to get started.
        </p>
      </div>
    );
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
        {sessions.map((session) => (
          <Card
            key={session.session_id}
            className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20 cursor-pointer"
            onClick={() => {
              window.location.href = 
                `/student/${studentId}/pdf-summary/${session.session_id}`;
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">
                      {session.file_name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(session.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Session ID: {session.session_id}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Click to open this PDF chat session
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
