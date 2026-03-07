import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PdfSummaryAudio,
  PdfSummaryAudioDocument,
} from '../schemas/pdf-summary-audio.schema';
import { LMS_AI_CONNECTION_NAME } from '../constants';

@Injectable()
export class PdfSummaryAudioRepository {
  constructor(
    @InjectModel(PdfSummaryAudio.name, LMS_AI_CONNECTION_NAME)
    private pdfSummaryAudioModel: Model<PdfSummaryAudioDocument>,
  ) {}

  async create(
    audioData: Partial<PdfSummaryAudio>,
  ): Promise<PdfSummaryAudioDocument> {
    const audio = new this.pdfSummaryAudioModel(audioData);
    return audio.save();
  }

  async findBySessionId(sessionId: string): Promise<PdfSummaryAudioDocument[]> {
    return this.pdfSummaryAudioModel
      .find({ session_id: sessionId })
      .sort({ created_at: -1 })
      .exec();
  }

  async findByUserId(userId: string): Promise<PdfSummaryAudioDocument[]> {
    return this.pdfSummaryAudioModel
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .exec();
  }

  /** Find all audio recordings for the given session IDs (e.g. user's sessions). */
  async findBySessionIds(
    sessionIds: string[],
  ): Promise<PdfSummaryAudioDocument[]> {
    if (!sessionIds?.length) {
      return [];
    }
    return this.pdfSummaryAudioModel
      .find({ session_id: { $in: sessionIds } })
      .sort({ created_at: -1 })
      .exec();
  }
}
