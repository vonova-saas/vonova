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

  async deleteBySessionId(sessionId: string): Promise<boolean> {
    const result = await this.pdfSummaryModel.deleteMany({ session_id: sessionId }).exec();
    return result.deletedCount > 0;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.pdfSummaryModel.deleteMany({ user_id: userId }).exec();
    return result.deletedCount;
  }

  async getTotalCount(): Promise<number> {
    return this.pdfSummaryModel.countDocuments().exec();
  }

  async getActiveSessionsCount(): Promise<number> {
    return this.pdfSummaryModel.countDocuments({ status: 'completed' }).exec();
  }

  async getAverageProcessingTime(): Promise<number> {
    const result = await this.pdfSummaryModel.aggregate([
      { $group: { _id: null, avg: { $avg: '$processing_time_ms' } } }
    ]).exec();
    return result.length > 0 ? result[0].avg || 0 : 0;
  }

  async getLanguageDistribution(): Promise<Record<string, number>> {
    const result = await this.pdfSummaryModel.aggregate([
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $project: { language: '$_id', count: 1, _id: 0 } }
    ]).exec();

    const distribution: Record<string, number> = {};
    result.forEach((item: any) => {
      distribution[item.language || 'unknown'] = item.count;
    });
    return distribution;
  }
}
