import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PdfSummary, PdfSummaryDocument } from '../schemas/pdf-summary.schema';
import { LMS_AI_CONNECTION_NAME } from '../constants';

@Injectable()
export class PdfSummaryRepository {
  constructor(
    @InjectModel(PdfSummary.name, LMS_AI_CONNECTION_NAME)
    private pdfSummaryModel: Model<PdfSummaryDocument>,
  ) {}

  /**
   * Builds a query that matches user_id as either string or ObjectId (24-char hex).
   * Ensures sessions are found regardless of how user_id was stored in the DB.
   */
  private userMatch(userId: string): {
    user_id?: string;
    $or?: Array<{ user_id: string | Types.ObjectId }>;
  } {
    const strId = String(userId).trim();
    try {
      if (/^[a-fA-F0-9]{24}$/.test(strId)) {
        const oid = new Types.ObjectId(strId);
        return { $or: [{ user_id: strId }, { user_id: oid }] };
      }
    } catch {
      // fall through
    }
    return { user_id: strId };
  }

  async create(summaryData: Partial<PdfSummary>): Promise<PdfSummaryDocument> {
    const summary = new this.pdfSummaryModel(summaryData);
    return summary.save();
  }

  async findBySessionId(sessionId: string): Promise<PdfSummaryDocument | null> {
    return this.pdfSummaryModel.findOne({ session_id: sessionId }).exec();
  }

  async findByUserId(userId: string): Promise<PdfSummaryDocument[]> {
    return this.pdfSummaryModel
      .find(this.userMatch(userId))
      .sort({ created_at: -1 })
      .exec();
  }

  async findByFileHash(
    fileHash: string,
    summaryType: string,
  ): Promise<PdfSummaryDocument | null> {
    return this.pdfSummaryModel
      .findOne({ file_hash: fileHash, summary_type: summaryType })
      .exec();
  }

  /**
   * Finds a summary by file_hash and user_id (for reuse when same user re-uploads same file).
   * Returns null when userId is missing (anonymous uploads are not reused by user).
   */
  async findByFileHashAndUser(
    fileHash: string,
    userId: string | undefined,
  ): Promise<PdfSummaryDocument | null> {
    if (
      userId === undefined ||
      userId === null ||
      String(userId).trim() === ''
    ) {
      return null;
    }
    const userCondition = this.userMatch(userId);
    return this.pdfSummaryModel
      .findOne({ file_hash: fileHash, ...userCondition })
      .sort({ created_at: -1 })
      .exec();
  }

  async updateStatus(
    sessionId: string,
    status: string,
  ): Promise<PdfSummaryDocument | null> {
    return this.pdfSummaryModel
      .findOneAndUpdate(
        { session_id: sessionId },
        { status, updated_at: new Date() },
        { new: true },
      )
      .exec();
  }

  async countByUserId(userId: string): Promise<number> {
    return this.pdfSummaryModel.countDocuments(this.userMatch(userId)).exec();
  }

  async deleteBySessionId(sessionId: string): Promise<boolean> {
    const result = await this.pdfSummaryModel
      .deleteMany({ session_id: sessionId })
      .exec();
    return result.deletedCount > 0;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.pdfSummaryModel
      .deleteMany(this.userMatch(userId))
      .exec();
    return result.deletedCount;
  }

  async getTotalCount(userId?: string): Promise<number> {
    const query = userId ? this.userMatch(userId) : {};
    return this.pdfSummaryModel.countDocuments(query).exec();
  }

  async getActiveSessionsCount(userId?: string): Promise<number> {
    const query = userId
      ? { $and: [this.userMatch(userId), { status: 'completed' }] }
      : { status: 'completed' };
    return this.pdfSummaryModel.countDocuments(query).exec();
  }

  async getAverageProcessingTime(userId?: string): Promise<number> {
    const matchStage = userId ? this.userMatch(userId) : {};

    const pipeline: any[] = [];
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }
    pipeline.push({
      $group: { _id: null, avg: { $avg: '$processing_time_ms' } },
    });

    const result = await this.pdfSummaryModel.aggregate(pipeline).exec();
    return result.length > 0 ? result[0].avg || 0 : 0;
  }

  async getLanguageDistribution(): Promise<Record<string, number>> {
    const result = await this.pdfSummaryModel
      .aggregate([
        { $group: { _id: '$language', count: { $sum: 1 } } },
        { $project: { language: '$_id', count: 1, _id: 0 } },
      ])
      .exec();

    const distribution: Record<string, number> = {};
    result.forEach((item: any) => {
      distribution[item.language || 'unknown'] = item.count;
    });
    return distribution;
  }
}
