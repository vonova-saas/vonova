import mongoose, { Schema, Document } from 'mongoose';
import { getServiceConnection } from '../../config/database.config';

// Interface for Week structure
export interface IWeek {
  week: number;
  title: string;
  objectives: string[];
  topics: string[];
  resources: string[];
  projects: string[];
  estimated_hours: number;
}

// Interface for Milestone structure
export interface IMilestone {
  week: number;
  milestone: string;
  deliverable: string;
}

// Interface for Chapter structure (for frontend tree visualization)
export interface IChapter {
  name: string;
  children: Array<{ name: string }>;
}

// Interface for Tree structure (for frontend visualization)
export interface ITreeNode {
  name: string;
  children: IChapter[];
}

// Interface for Roadmap Generation Request
export interface IRoadmapRequest {
  topic: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  focus_areas?: string[];
  user_id?: string;
}

// Interface for Roadmap Response
export interface IRoadmapResponse {
  status: boolean;
  text: {
    query: string;
    chapters: Record<string, string[]>;
  };
  tree: ITreeNode[];
  roadmapId: string;
  metadata: {
    generated: string;
    summary: string;
  };
  roadmap_data?: IRoadmapData;
}

// Interface for complete Roadmap Data
export interface IRoadmapData extends Document {
  roadmapId: string;
  title: string;
  overview: string;
  prerequisites: string[];
  weeks: IWeek[];
  milestones: IMilestone[];
  final_project: string;
  next_steps: string[];
  
  // Request metadata
  topic: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks: number;
  focus_areas?: string[];
  
  // User and tracking
  user_id?: string;
  created_at: Date;
  updated_at: Date;
  
  // AI generation metadata
  ai_model_used?: string;
  generation_time_ms?: number;
  total_estimated_hours?: number;
  
  // Status tracking
  status: 'generated' | 'in_progress' | 'completed' | 'archived';
}

// Week Schema
const WeekSchema = new Schema<IWeek>({
  week: { type: Number, required: true },
  title: { type: String, required: true },
  objectives: [{ type: String, required: true }],
  topics: [{ type: String, required: true }],
  resources: [{ type: String, required: true }],
  projects: [{ type: String, required: true }],
  estimated_hours: { type: Number, required: true, min: 1, max: 168 }
}, { _id: false });

// Milestone Schema
const MilestoneSchema = new Schema<IMilestone>({
  week: { type: Number, required: true },
  milestone: { type: String, required: true },
  deliverable: { type: String, required: true }
}, { _id: false });

// Main Roadmap Schema
const RoadmapSchema = new Schema<IRoadmapData>({
  roadmapId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  title: { type: String, required: true },
  overview: { type: String, required: true },
  prerequisites: [{ type: String, required: true }],
  weeks: [WeekSchema],
  milestones: [MilestoneSchema],
  final_project: { type: String, required: true },
  next_steps: [{ type: String, required: true }],
  
  // Request metadata
  topic: { type: String, required: true, index: true },
  skill_level: { 
    type: String, 
    required: true, 
    enum: ['beginner', 'intermediate', 'advanced'],
    index: true 
  },
  duration_weeks: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 52,
    index: true 
  },
  focus_areas: [{ type: String }],
  
  // User and tracking
  user_id: { type: String, index: true },
  created_at: { type: Date, default: Date.now, index: true },
  updated_at: { type: Date, default: Date.now },
  
  // AI generation metadata
  ai_model_used: { type: String, default: 'cohere-command-r-plus' },
  generation_time_ms: { type: Number },
  total_estimated_hours: { type: Number },
  
  // Status tracking
  status: { 
    type: String, 
    enum: ['generated', 'in_progress', 'completed', 'archived'],
    default: 'generated',
    index: true 
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better query performance
RoadmapSchema.index({ topic: 1, skill_level: 1, duration_weeks: 1 });
RoadmapSchema.index({ user_id: 1, created_at: -1 });
RoadmapSchema.index({ status: 1, created_at: -1 });

// Virtual for total estimated hours calculation
RoadmapSchema.virtual('calculatedTotalHours').get(function() {
  return this.weeks.reduce((total, week) => total + week.estimated_hours, 0);
});

// Pre-save middleware to calculate total hours
RoadmapSchema.pre('save', function(next) {
  if (this.weeks && this.weeks.length > 0) {
    this.total_estimated_hours = this.weeks.reduce((total, week) => total + week.estimated_hours, 0);
  }
  this.updated_at = new Date();
  next();
});

// Static methods for common queries
RoadmapSchema.statics.findByTopic = function(topic: string) {
  return this.find({ topic: new RegExp(topic, 'i') }).sort({ created_at: -1 });
};

RoadmapSchema.statics.findByUser = function(userId: string) {
  return this.find({ user_id: userId }).sort({ created_at: -1 });
};

RoadmapSchema.statics.findSimilar = function(topic: string, skillLevel: string, durationWeeks: number) {
  return this.find({
    topic: new RegExp(topic, 'i'),
    skill_level: skillLevel,
    duration_weeks: { $gte: durationWeeks - 2, $lte: durationWeeks + 2 }
  }).sort({ created_at: -1 }).limit(5);
};

export default getServiceConnection('roadmap').model<IRoadmapData>('Roadmap', RoadmapSchema);
