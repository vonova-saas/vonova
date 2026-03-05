import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PdfSummaryAudio,
  PdfSummaryAudioDocument,
} from '../schemas/pdf-summary-audio.schema';
import { PDF_SUMMARY_AI_AUDIO_CONNECTION_NAME } from '../constants';

@Injectable()
export class PdfSummaryAudioRepository {
  constructor(
    @InjectModel(PdfSummaryAudio.name, PDF_SUMMARY_AI_AUDIO_CONNECTION_NAME)
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
}
