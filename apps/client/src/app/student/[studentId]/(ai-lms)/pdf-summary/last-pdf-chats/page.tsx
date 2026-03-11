"use client";

import PDFSummaryList from "@/components/student/ai-lms/pdf-summary/pdf-summary-list";

export default function PDFSummaryListPage() {
  
  return (
    <div
      className="h-full w-full flex flex-col overflow-hidden relative"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)",
        backgroundSize: "18px 18px",
      }}
    >
      {/* PDF List Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <PDFSummaryList />
        </div>
      </div>
    </div>
  );
}
