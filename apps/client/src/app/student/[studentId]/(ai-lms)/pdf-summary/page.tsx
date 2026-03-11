"use client";

import { useParams } from "next/navigation";
import PDFSummaryChat from "@/components/student/ai-lms/pdf-summary/pdf-summary-chat";

export default function PDFSummaryPage() {
  const params = useParams();
  const studentId = params?.studentId as string;
  
  console.log("PDFSummaryPage params:", params);
  console.log("PDFSummaryPage studentId:", studentId);
  
  return <PDFSummaryChat isIndividualChat={false} studentId={studentId} />;
}
