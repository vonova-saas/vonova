export interface IPDFSummaryRequest {
  session_id: string;
  summary_type?: 'brief' | 'detailed' | 'comprehensive';
  user_id?: string;
}

export interface IPDFSummaryResponse {
  status: boolean;
  summary: string;
  summary_type: string;
  filename: string;
  session_id: string;
  metadata: {
    generated: string;
    ai_model_used: string;
    processing_time_ms: number;
    file_size_bytes: number;
    total_pages: number;
  };
}

export interface IPDFSummaryData {
  summaryId: string;
  session_id: string;
  filename: string;
  original_filename: string;
  summary_type: 'brief' | 'detailed' | 'comprehensive';
  summary_content: string;
  file_size_bytes: number;
  total_pages: number;
  file_hash: string;
  ai_model_used: string;
  processing_time_ms: number;
  chunks_processed: number;
  user_id?: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: Date;
  updated_at: Date;
}

export interface IPDFChatRequest {
  session_id: string;
  question: string;
  user_id?: string;
  context_length?: number;
}

export interface IPDFChatResponse {
  status: boolean;
  answer: string;
  session_id: string;
  filename: string;
  user_id?: string;
  ai_wizard_status: 'active' | 'inactive' | 'error';
  magic_level: 'normal' | 'enhanced' | 'cached';
  message: string;
  metadata: {
    generated: string;
    ai_model_used: string;
    response_time_ms: number;
    tokens_used: number;
  };
}

export interface IPDFUploadRequest {
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  };
  user_id?: string;
  auto_summarize?: boolean;
  summary_type?: 'brief' | 'detailed' | 'comprehensive';
}

export interface IPDFUploadResponse {
  status: boolean;
  session_id: string;
  brief_summary: string;
  user_id?: string;
  magic_level: 'normal' | 'enhanced' | 'cached';
  enchantment_status: 'uploaded' | 'processing' | 'completed' | 'reused';
  message: string;
  metadata: {
    filename: string;
    file_size_bytes: number;
    total_pages: number;
    processing_time_ms: number;
    s3_key?: string;
    s3_url?: string;
  };
}
