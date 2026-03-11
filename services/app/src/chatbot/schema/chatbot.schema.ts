import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatbotDocument = Chatbot & Document;

@Schema({ timestamps: true })
export class Chatbot {
  @Prop({ required: true, index: true })
  chatId: string;

  @Prop({ required: true, index: true })
  sessionId: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: 'user' })
  role: string;
}

export const ChatbotSchema = SchemaFactory.createForClass(Chatbot);
