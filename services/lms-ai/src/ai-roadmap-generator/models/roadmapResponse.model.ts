import mongoose, { Schema, Document } from 'mongoose';
import { getServiceConnection } from '../../config/database.config';

// Interface for storing complete AI response data
export interface IRoadmapResponseData extends Document {
  roadmapId: string;
  
  // Complete AI response structure
  status: boolean;
  text: {
    query: string;
    chapters: Record<string, string[]>;
  };
  tree: Array<{
    name: string;
    children: Array<{
      name: string;
      children?: Array<{ name: string }>;
    }>;
  }>;
  metadata: {
    generated: string;
    summary: string;
  };
  
  // Request data
  original_request: {
    topic: string;
    skill_level: 'beginner' | 'intermediate' | 'advanced';
    duration_weeks: number;
    focus_areas?: string[];
    userId: mongoose.Schema.Types.ObjectId;
  };
  
  // Tracking
  created_at: Date;
  updated_at: Date;
  generation_time_ms?: number;
  ai_model_used?: string;
}

// Schema for complete AI response storage
const RoadmapResponseSchema = new Schema<IRoadmapResponseData>({
  roadmapId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  
  // AI Response structure
  status: { type: Boolean, required: true },
  text: {
    query: { type: String, required: true },
    chapters: { type: Schema.Types.Mixed, required: true }
  },
  tree: [{ type: Schema.Types.Mixed }],
  metadata: {
    generated: { type: String, required: true },
    summary: { type: String, required: true }
  },
  
  // Original request data
  original_request: {
    topic: { type: String, required: true },
    skill_level: { 
      type: String, 
      required: true, 
      enum: ['beginner', 'intermediate', 'advanced'] 
    },
    duration_weeks: { type: Number, required: true },
    focus_areas: [{ type: String }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Tracking
  created_at: { type: Date, default: Date.now, index: true },
  updated_at: { type: Date, default: Date.now },
  generation_time_ms: { type: Number },
  ai_model_used: { type: String, default: 'cohere-command-r-plus' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better query performance
RoadmapResponseSchema.index({ 'original_request.topic': 1 });
RoadmapResponseSchema.index({ 'original_request.skill_level': 1 });
RoadmapResponseSchema.index({ 'original_request.userId': 1, created_at: -1 });

export default getServiceConnection('roadmap').model<IRoadmapResponseData>('RoadmapResponse', RoadmapResponseSchema);
