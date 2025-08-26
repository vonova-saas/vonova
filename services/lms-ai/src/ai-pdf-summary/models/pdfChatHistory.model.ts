import mongoose, { Schema, Document } from 'mongoose';
import { getServiceConnection } from '../../config/database.config';

// Interface for PDF Chat History
export interface IPDFChatHistory extends Document {
  chatId: string;
  session_id: string;
  user_id?: string;
  filename: string;
  question: string;
  answer: string;
  
  // AI response metadata
  ai_wizard_status: string;
  magic_level: string;
  ai_model_used: string;
  response_time_ms: number;
  tokens_used: number;
  
  // User interaction metadata
  user_satisfaction?: number; // 1-5 rating
  follow_up_questions?: string[];
  context_length?: number;
  
  // Tracking metadata
  ip_address?: string;
  user_agent?: string;
  timestamp: Date;
  
  // Session metadata
  session_duration_minutes?: number;
  total_questions_in_session?: number;
}

// PDF Chat History Schema
const PDFChatHistorySchema = new Schema<IPDFChatHistory>({
  chatId: { type: String, required: true, unique: true },
  session_id: { type: String, required: true, index: true },
  user_id: { type: String, index: true },
  filename: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  
  // AI response metadata
  ai_wizard_status: { type: String, required: true },
  magic_level: { type: String, required: true },
  ai_model_used: { type: String, required: true },
  response_time_ms: { type: Number, required: true, min: 0 },
  tokens_used: { type: Number, required: true, min: 0 },
  
  // User interaction metadata
  user_satisfaction: { type: Number, min: 1, max: 5 },
  follow_up_questions: [{ type: String }],
  context_length: { type: Number, min: 0 },
  
  // Tracking metadata
  ip_address: { type: String },
  user_agent: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
  
  // Session metadata
  session_duration_minutes: { type: Number, min: 0 },
  total_questions_in_session: { type: Number, min: 0 }
}, {
  timestamps: true,
  collection: 'pdf_chat_history'
});

// Indexes for better query performance
PDFChatHistorySchema.index({ session_id: 1, timestamp: -1 });
PDFChatHistorySchema.index({ user_id: 1, timestamp: -1 });
PDFChatHistorySchema.index({ filename: 1 });

// Use separate database connection for PDF Summary service
const pdfSummaryConnection = getServiceConnection('pdfSummary');
export default pdfSummaryConnection.model<IPDFChatHistory>('PDFChatHistory', PDFChatHistorySchema);
