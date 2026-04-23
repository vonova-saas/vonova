import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AIInteractionDocument = AIInteraction & Document;

@Schema({
  collection: 'ai_interactions',
  timestamps: { createdAt: 'createdAt', updatedAt: false },
})
export class AIInteraction {
  @Prop({ required: true, trim: true, index: true })
  userId: string;

  @Prop({ required: true, trim: true, index: true })
  problemId: string;

  @Prop({ required: true, enum: ['hint', 'solution'], index: true })
  type: 'hint' | 'solution';

  @Prop({ type: Number, enum: [1, 2, 3], required: false })
  level?: 1 | 2 | 3;

  @Prop({ required: true })
  response: string;

  @Prop()
  createdAt: Date;
}

export const AIInteractionSchema = SchemaFactory.createForClass(AIInteraction);
AIInteractionSchema.index({ userId: 1, problemId: 1, type: 1, createdAt: -1 });

