import mongoose, { Schema, Document } from 'mongoose';

// Interface for Roadmap History (for analytics and tracking)
export interface IRoadmapHistory extends Document {
  roadmapId: string;
  user_id?: string;
  action: 'generated' | 'viewed' | 'started' | 'week_completed' | 'milestone_reached' | 'completed' | 'archived';
  week_number?: number;
  milestone_week?: number;
  progress_percentage?: number;
  time_spent_minutes?: number;
  notes?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: Date;
}

// Roadmap History Schema
const RoadmapHistorySchema = new Schema<IRoadmapHistory>({
  roadmapId: { 
    type: String, 
    required: true,
    index: true,
    ref: 'Roadmap'
  },
  user_id: { type: String, index: true },
  action: { 
    type: String, 
    required: true,
    enum: ['generated', 'viewed', 'started', 'week_completed', 'milestone_reached', 'completed', 'archived'],
    index: true
  },
  week_number: { 
    type: Number, 
    min: 1,
    max: 52
  },
  milestone_week: { 
    type: Number, 
    min: 1,
    max: 52
  },
  progress_percentage: { 
    type: Number, 
    min: 0, 
    max: 100 
  },
  time_spent_minutes: { 
    type: Number, 
    min: 0 
  },
  notes: { type: String, maxlength: 1000 },
  metadata: { type: Schema.Types.Mixed },
  ip_address: { type: String },
  user_agent: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
}, {
  timestamps: false // Using custom timestamp field
});

// Compound indexes for better query performance
RoadmapHistorySchema.index({ roadmapId: 1, timestamp: -1 });
RoadmapHistorySchema.index({ user_id: 1, action: 1, timestamp: -1 });
RoadmapHistorySchema.index({ action: 1, timestamp: -1 });

// Static methods for analytics
RoadmapHistorySchema.statics.getUserProgress = function(userId: string, roadmapId: string) {
  return this.find({ 
    user_id: userId, 
    roadmapId: roadmapId 
  }).sort({ timestamp: -1 });
};

RoadmapHistorySchema.statics.getCompletionStats = function(roadmapId: string) {
  return this.aggregate([
    { $match: { roadmapId: roadmapId } },
    { 
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        unique_users: { $addToSet: '$user_id' }
      }
    },
    {
      $project: {
        action: '$_id',
        count: 1,
        unique_user_count: { $size: '$unique_users' }
      }
    }
  ]);
};

RoadmapHistorySchema.statics.getPopularTopics = function(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    { 
      $match: { 
        action: 'generated',
        timestamp: { $gte: startDate }
      }
    },
    {
      $lookup: {
        from: 'roadmaps',
        localField: 'roadmapId',
        foreignField: 'roadmapId',
        as: 'roadmap'
      }
    },
    { $unwind: '$roadmap' },
    {
      $group: {
        _id: '$roadmap.topic',
        count: { $sum: 1 },
        skill_levels: { $addToSet: '$roadmap.skill_level' },
        avg_duration: { $avg: '$roadmap.duration_weeks' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
};

export default mongoose.model<IRoadmapHistory>('RoadmapHistory', RoadmapHistorySchema);
