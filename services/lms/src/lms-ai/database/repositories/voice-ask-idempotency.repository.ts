import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  VoiceAskIdempotency,
  VoiceAskIdempotencyDocument,
} from '../schemas/voice-ask-idempotency.schema';
import { LMS_AI_CONNECTION_NAME } from '../constants';

@Injectable()
export class VoiceAskIdempotencyRepository {
  constructor(
    @InjectModel(VoiceAskIdempotency.name, LMS_AI_CONNECTION_NAME)
    private model: Model<VoiceAskIdempotencyDocument>,
  ) {}

  async claim(key: string): Promise<boolean> {
    try {
      await this.model.create({
        key,
        status: 'processing',
        created_at: new Date(),
      });
      return true;
    } catch (err: unknown) {
      const code = (err as { code?: number })?.code;
      if (code === 11000) return false;
      throw err;
    }
    return false;
  }

  async get(key: string): Promise<VoiceAskIdempotencyDocument | null> {
    return this.model.findOne({ key }).exec();
  }

  async setCompleted(
    key: string,
    response: Record<string, unknown>,
  ): Promise<void> {
    await this.model
      .updateOne(
        { key },
        { $set: { status: 'completed', response, updated_at: new Date() } },
      )
      .exec();
  }
}
