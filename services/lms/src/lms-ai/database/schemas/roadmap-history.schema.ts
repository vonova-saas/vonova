import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoadmapHistoryDocument = RoadmapHistory & Document;

@Schema({
  collection: 'ROADMAP_AI_HISTORY',
  timestamps: false
})
export class RoadmapHistory {
  @Prop({
    type: String,
    required: true,
    index: true,
    ref: 'Roadmap'
  })
  roadmapId: string;

  @Prop({
    type: String,
    required: true
  })
  userId: string;

  @Prop({
    required: true,
    enum: ['generated', 'viewed', 'started', 'week_completed', 'milestone_reached', 'completed', 'archived'],
    index: true
  })
  action: 'generated' | 'viewed' | 'started' | 'week_completed' | 'milestone_reached' | 'completed' | 'archived';

  @Prop({
    min: 1,
    max: 52
  })
  week_number: number;

  @Prop({
    min: 1,
    max: 52
  })
  milestone_week: number;

  @Prop({
    min: 0,
    max: 100
  })
  progress_percentage: number;

  @Prop({
    min: 0
  })
  time_spent_minutes: number;

  @Prop({ maxlength: 1000 })
  notes: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop()
  ip_address: string;

  @Prop()
  user_agent: string;

  @Prop({ default: Date.now, index: true })
  timestamp: Date;
}

export const RoadmapHistorySchema = SchemaFactory.createForClass(RoadmapHistory);

// Compound indexes for better query performance
RoadmapHistorySchema.index({ roadmapId: 1, timestamp: -1 });
RoadmapHistorySchema.index({ userId: 1 });
RoadmapHistorySchema.index({ action: 1, timestamp: -1 });
