import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoadmapDocument = Roadmap & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Week {
  @Prop({ required: true })
  week: number;

  @Prop({ required: true })
  title: string;

  @Prop({ type: [String], required: true })
  objectives: string[];

  @Prop({ type: [String], required: true })
  topics: string[];

  @Prop({ type: [String], required: true })
  resources: string[];

  @Prop({ type: [String], required: true })
  projects: string[];

  @Prop({ required: true, min: 1, max: 168 })
  estimated_hours: number;
}

@Schema({ timestamps: false })
export class Milestone {
  @Prop({ required: true })
  week: number;

  @Prop({ required: true })
  milestone: string;

  @Prop({ required: true })
  deliverable: string;
}

@Schema({
  collection: 'ROADMAP_AI',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Roadmap {
  @Prop({ required: true, unique: true, index: true })
  roadmapId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  overview: string;

  @Prop({ type: [String], required: true })
  prerequisites: string[];

  @Prop({ type: [Week], required: true })
  weeks: Week[];

  @Prop({ type: [Milestone], required: true })
  milestones: Milestone[];

  @Prop({ required: true })
  final_project: string;

  @Prop({ type: [String], required: true })
  next_steps: string[];

  // Request metadata
  @Prop({ required: true, index: true })
  topic: string;

  @Prop({
    required: true,
    enum: ['beginner', 'intermediate', 'advanced', 'Beginner', 'Intermediate', 'Advanced'],
    index: true,
  })
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'Beginner' | 'Intermediate' | 'Advanced';

  @Prop({
    required: true,
    min: 1,
    max: 52,
    index: true,
  })
  duration_weeks: number;

  @Prop({ type: [String] })
  focus_areas: string[];

  // User and tracking (index defined via RoadmapSchema.index({ userId: 1 }) below)
  @Prop({
    type: String,
    required: true,
  })
  userId: string;

  @Prop({ default: Date.now, index: true })
  created_at: Date;

  @Prop({ default: Date.now })
  updated_at: Date;

  // AI generation metadata
  @Prop({ default: 'cohere-command-r-plus' })
  ai_model_used: string;

  @Prop()
  generation_time_ms: number;

  @Prop()
  total_estimated_hours: number;

  // Status tracking
  @Prop({
    enum: ['generated', 'in_progress', 'completed', 'archived'],
    default: 'generated',
    index: true,
  })
  status: 'generated' | 'in_progress' | 'completed' | 'archived';
}

export const RoadmapSchema = SchemaFactory.createForClass(Roadmap);

// Indexes for better query performance
RoadmapSchema.index({ topic: 1, skill_level: 1, duration_weeks: 1 });
RoadmapSchema.index({ userId: 1 });
RoadmapSchema.index({ status: 1, created_at: -1 });

// Virtual for total estimated hours calculation
RoadmapSchema.virtual('calculatedTotalHours').get(function () {
  return this.weeks.reduce((total, week) => total + week.estimated_hours, 0);
});

// Pre-save middleware to calculate total hours
RoadmapSchema.pre('save', function (next) {
  if (this.weeks && this.weeks.length > 0) {
    this.total_estimated_hours = this.weeks.reduce(
      (total, week) => total + week.estimated_hours,
      0,
    );
  }
  this.updated_at = new Date();
  next();
});

// Static methods for common queries
RoadmapSchema.statics.findByTopic = function (topic: string) {
  return this.find({ topic: new RegExp(topic, 'i') }).sort({ created_at: -1 });
};

RoadmapSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId: userId }).sort({ created_at: -1 });
};

RoadmapSchema.statics.findSimilar = function (
  topic: string,
  skillLevel: string,
  durationWeeks: number,
) {
  return this.find({
    topic: new RegExp(topic, 'i'),
    skill_level: skillLevel,
    duration_weeks: { $gte: durationWeeks - 2, $lte: durationWeeks + 2 },
  })
    .sort({ created_at: -1 })
    .limit(5);
};
