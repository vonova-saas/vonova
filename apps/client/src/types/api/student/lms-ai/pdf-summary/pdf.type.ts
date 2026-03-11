// ============== Upload Types ==============
export type UploadPDFRequest = {
  user_id: string;
  auto_summarize?: boolean;
  summary_type?: string;
  language?: string;
  file: File;
};

export type UploadPDFResponse = {
  session_id: string;
  file_name: string;
  file_size: number;
  pages?: number;
  status: string;
  message: string;
};

// ============== Chat Types ==============
export type ChatRequest = {
  session_id: string;
  question: string;
  user_id: string;
  context_length?: number;
};

export type ChatResponse = {
  answer: string;
  session_id: string;
  message_id?: string;
};

// ============== Summary Types ==============
export type GetSummaryRequest = {
  session_id: string;
  user_id: string;
};

export type GetSummaryResponse = {
  session_id: string;
  summary: string;
  key_points?: string[];
  topics?: string[];
  word_count?: number;
};

// ============== Chat History Types ==============
export type ChatHistoryMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export type ChatHistoryResponse = {
  session_id: string;
  messages: ChatHistoryMessage[];
};

// ============== Delete Session Types ==============
export type DeleteSessionResponse = {
  message: string;
};
// ============== Sessions List Types ==============
export type GetSessionsResponse = {
  sessions: {
    session_id: string;
    file_name: string;
    created_at: string;
    status: string;
  }[];
};