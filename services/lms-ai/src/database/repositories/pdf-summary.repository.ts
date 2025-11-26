import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PdfSummary, PdfSummaryDocument } from '../schemas/pdf-summary.schema';

@Injectable()
export class PdfSummaryRepository {
  constructor(
    @InjectModel(PdfSummary.name) private pdfSummaryModel: Model<PdfSummaryDocument>,
  ) { }

  async create(summaryData: Partial<PdfSummary>): Promise<PdfSummaryDocument> {
    const summary = new this.pdfSummaryModel(summaryData);
    return summary.save();
  }

  async findBySessionId(sessionId: string): Promise<PdfSummaryDocument | null> {
    return this.pdfSummaryModel.findOne({ session_id: sessionId }).exec();
  }

  async findByUserId(userId: string): Promise<PdfSummaryDocument[]> {
    return this.pdfSummaryModel.find({ user_id: userId }).sort({ created_at: -1 }).exec();
  }

  async findByFileHash(fileHash: string, summaryType: string): Promise<PdfSummaryDocument | null> {
    return this.pdfSummaryModel.findOne({ file_hash: fileHash, summary_type: summaryType }).exec();
  }

  async updateStatus(sessionId: string, status: string): Promise<PdfSummaryDocument | null> {
    return this.pdfSummaryModel.findOneAndUpdate(
      { session_id: sessionId },
      { status, updated_at: new Date() },
      { new: true }
    ).exec();
  }

  async countByUserId(userId: string): Promise<number> {
    return this.pdfSummaryModel.countDocuments({ user_id: userId }).exec();
  }
}
