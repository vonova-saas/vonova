"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSessionsQueryFn } from "@/services/student/lms-ai/pdf-summary/pdf.api";
import { useUserId } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, MessageSquare, Clock, ArrowRight } from "lucide-react";
import { GetSessionsResponse } from "@/types/api/student/lms-ai/pdf-summary/pdf.type";

// Define session type for consistency
type Session = {
  session_id: string;
  filename: string;
  created_at: string;
  status: string;
};

interface LastPDFChatsProps {
  onChat: (pdfId: string) => void;
}

export default function LastPDFChats({ onChat }: LastPDFChatsProps) {
  const rawId = useUserId();
  const studentId = rawId && rawId !== "undefined" ? rawId : "";
  const [localSessions, setLocalSessions] = useState<any[]>([]);

  const { data, isLoading, error } = useQuery<GetSessionsResponse>({
    queryKey: ["pdf-sessions"],
    queryFn: getSessionsQueryFn,
    enabled: !!studentId,
  });

  // Load local sessions on client only to avoid SSR/CSR text mismatches.
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

  // Get sessions by merging API results with localStorage and removing duplicates
  const getSessionData = () => {
    const allSessions: Session[] = [];
    const sessionIds = new Set<string>();
    
    // Add API sessions - new format returns data array directly from getSessionsQueryFn
    if (data?.data && Array.isArray(data.data)) {
      data.data.forEach((session: any) => {
        if (!sessionIds.has(session.session_id)) {
          allSessions.push({
            session_id: session.session_id,
            filename: session.filename,
            created_at: session.created_at,
            status: session.status || "ready"
          });
          sessionIds.add(session.session_id);
        }
      });
    }
    
    // Add localStorage sessions (loaded after mount) and merge with API results
    localSessions.forEach((session: any) => {
      if (!sessionIds.has(session.session_id)) {
        allSessions.push({
          session_id: session.session_id,
          filename: session.filename || session.file_name, // Handle both field names
          created_at: session.created_at,
          status: session.status || "ready",
        });
        sessionIds.add(session.session_id);
      }
    });
    
    // Sort by created_at descending (newest first)
    return allSessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const sessions = getSessionData();

  const handleViewAll = () => {
    if (!studentId) return;
    window.location.href = `/student/${studentId}/pdf-summary/last-pdf-chats`;
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-semibold sm:text-lg">Recent PDF Chats</h3>
          <Button variant="ghost" size="sm" onClick={handleViewAll} className="w-fit cursor-pointer self-start sm:self-auto">
            <span className="hidden xs:inline">View All</span>
            <span className="xs:hidden">View</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="group border-2">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="w-4 h-4 rounded" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  /*const handleViewAll = () => {
    window.location.href = `/student/${studentId}/pdf-summary/last-pdf-chats`;
  };*/


  if (sessions.length === 0) {
    return (
      <div className="w-full space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-semibold sm:text-lg">Recent PDF Chats</h3>
          <Button variant="ghost" size="sm" onClick={handleViewAll} className="w-fit cursor-pointer self-start sm:self-auto">
            <span className="hidden xs:inline">View All</span>
            <span className="xs:hidden">View</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        <Card className="p-16 border-2 border-dashed border-muted-foreground/20 bg-muted/5">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              No PDF chats yet
            </h3>
            <p className="text-base text-muted-foreground mb-6 max-w-md">
              Upload your first PDF and start chatting with AI to get instant summaries and insights from your documents.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold sm:text-lg">Recent PDF Chats</h3>
        <Button variant="ghost" size="sm" onClick={handleViewAll} className="w-fit cursor-pointer self-start sm:self-auto">
          <span className="hidden xs:inline">View All</span>
          <span className="xs:hidden">View</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sessions.map((session: Session) => (
          <Card
            key={session.session_id}
            className="group h-full min-h-44 cursor-pointer border-2 transition-all duration-200 hover:border-primary/20 hover:shadow-lg hover:-translate-y-1"
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
                    <CardTitle className="line-clamp-2 break-all text-sm font-semibold">
                      {session.filename}
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
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0">Session ID:</span>
                  <span className="line-clamp-2 break-all">{session.session_id}</span>
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
