import mongoose, { Schema, Document } from 'mongoose';
import { getServiceConnection } from '../../config/database.config';

// Interface for PDF Summary Request
export interface IPDFSummaryRequest {
  file_url?: string;
  file_content?: Buffer;
  summary_type: 'brief' | 'detailed' | 'chapter_wise' | 'key_points';
  focus_areas?: string[];
  max_length?: number;
  user_id?: string;
}

// Interface for PDF Summary Response
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
  summary_data?: IPDFSummaryData;
}

// Interface for complete PDF Summary Data
export interface IPDFSummaryData extends Document {
  summaryId: string;
  session_id: string;
  filename: string;
  original_filename: string;
  summary_type: 'brief' | 'detailed' | 'chapter_wise' | 'key_points';
  summary_content: string;
  focus_areas?: string[];
  max_length?: number;
  
  // File metadata
  file_size_bytes: number;
  total_pages: number;
  file_hash: string;
  
  // AI processing metadata
  ai_model_used: string;
  processing_time_ms: number;
  chunks_processed: number;
  
  // User and tracking
  user_id?: string;
  created_at: Date;
  updated_at: Date;
  
  // Status tracking
  status: 'processing' | 'completed' | 'failed' | 'archived';
  
  // Error tracking
  error_message?: string;
  retry_count: number;
}

// Interface for PDF Chat Request
export interface IPDFChatRequest {
  session_id: string;
  question: string;
  user_id?: string;
  context_length?: number;
}

// Interface for PDF Chat Response
export interface IPDFChatResponse {
  status: boolean;
  answer: string;
  session_id: string;
  filename: string;
  user_id?: string;
  ai_wizard_status: string;
  magic_level: string;
  message: string;
  metadata: {
    generated: string;
    ai_model_used: string;
    response_time_ms: number;
    tokens_used: number;
  };
}

// Interface for PDF Upload Request
export interface IPDFUploadRequest {
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  };
  user_id?: string;
  auto_summarize?: boolean;
  summary_type?: 'brief' | 'detailed' | 'chapter_wise' | 'key_points';
}

// Interface for PDF Upload Response
export interface IPDFUploadResponse {
  status: boolean;
  session_id: string;
  brief_summary: string;
  user_id?: string;
  magic_level: string;
  enchantment_status: string;
  message: string;
  metadata: {
    filename: string;
    file_size_bytes: number;
    total_pages: number;
    processing_time_ms: number;
  };
}

// PDF Summary Schema
const PDFSummarySchema = new Schema<IPDFSummaryData>({
  summaryId: { type: String, required: true, unique: true },
  session_id: { type: String, required: true, index: true },
  filename: { type: String, required: true },
  original_filename: { type: String, required: true },
  summary_type: { 
    type: String, 
    required: true, 
    enum: ['brief', 'detailed', 'chapter_wise', 'key_points'],
    default: 'brief'
  },
  summary_content: { type: String, required: true },
  focus_areas: [{ type: String, maxlength: 100 }],
  max_length: { type: Number, min: 100, max: 10000 },
  
  // File metadata
  file_size_bytes: { type: Number, required: true, min: 1 },
  total_pages: { type: Number, required: true, min: 1 },
  file_hash: { type: String, required: true, index: true },
  
  // AI processing metadata
  ai_model_used: { type: String, required: true },
  processing_time_ms: { type: Number, required: true, min: 0 },
  chunks_processed: { type: Number, required: true, min: 1 },
  
  // User and tracking
  user_id: { type: String, index: true },
  created_at: { type: Date, default: Date.now, index: true },
  updated_at: { type: Date, default: Date.now },
  
  // Status tracking
  status: { 
    type: String, 
    required: true, 
    enum: ['processing', 'completed', 'failed', 'archived'],
    default: 'processing',
    index: true
  },
  
  // Error tracking
  error_message: { type: String },
  retry_count: { type: Number, default: 0, min: 0 }
}, {
  timestamps: true,
  collection: 'pdf_summaries'
});

// Indexes for better query performance
PDFSummarySchema.index({ user_id: 1, created_at: -1 });
PDFSummarySchema.index({ status: 1, created_at: -1 });
PDFSummarySchema.index({ file_hash: 1 });
PDFSummarySchema.index({ session_id: 1 });

// Use separate database connection for PDF Summary service
const pdfSummaryConnection = getServiceConnection('pdfSummary');
export default pdfSummaryConnection.model<IPDFSummaryData>('PDFSummary', PDFSummarySchema);
