export type PDFFile = {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  summary?: string;
  pages: number;
  topics: string[];
  lastAccessed?: Date;
};

export type PDFMessage = {
  id: string;
  content: string;
  from: 'user' | 'assistant';
  timestamp: Date;
  pdfId?: string;
  type: 'text' | 'summary' | 'question' | 'error' | 'voice';
  // For recorded voice notes (user side)
  audioUrl?: string;
  audioDurationSec?: number;
  // For AI voice playback (client-side TTS)
  ttsText?: string;
};

export type PDFSummary = {
  id: string;
  pdfId: string;
  summary: string;
  keyPoints: string[];
  topics: string[];
  generatedAt: Date;
  wordCount: number;
};

export type PDFQuestion = {
  id: string;
  question: string;
  answer: string;
  pdfId: string;
  askedAt: Date;
};

export type UploadProgress = {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string | null;
}; 