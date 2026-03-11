"use client";

import PDFSummaryList from "@/components/student/ai-lms/pdf-summary/pdf-summary-list";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function PDFSummaryListPage() {
  const params = useParams();
  const studentId = params?.studentId as string;

  return (
    <div
      className="h-full w-full flex flex-col overflow-hidden relative"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)",
        backgroundSize: "18px 18px",
      }}
    >
      <button
        onClick={() => { window.location.href = `/student/${studentId}/pdf-summary`; }}
        className="flex items-center gap-1 text-lg text-muted-foreground hover:text-foreground transition-colors mb-4 px-4 pt-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to PDF Summary
      </button>
      
      {/* PDF List Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <PDFSummaryList />
        </div>
      </div>
    </div>
  );
}
