import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PdfChatHistory,
  PdfChatHistoryDocument,
} from '../schemas/pdf-chat-history.schema';
import { LMS_AI_CONNECTION_NAME } from '../constants';

@Injectable()
export class PdfChatHistoryRepository {
  constructor(
    @InjectModel(PdfChatHistory.name, LMS_AI_CONNECTION_NAME)
    private pdfChatHistoryModel: Model<PdfChatHistoryDocument>,
  ) { }

  async create(
    chatData: Partial<PdfChatHistory>,
  ): Promise<PdfChatHistoryDocument> {
    const chat = new this.pdfChatHistoryModel(chatData);
    return chat.save();
  }

  async findBySessionId(
    sessionId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    chats: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // Ensure sessionId is trimmed and not empty
    const cleanSessionId = sessionId?.trim() || '';

    if (!cleanSessionId) {
      return {
        chats: [],
        total: 0,
        page,
        totalPages: 0,
      };
    }

    const skip = (page - 1) * limit;

    // Use exact match for session_id
    const query = { session_id: cleanSessionId };

    const [chats, total] = await Promise.all([
      this.pdfChatHistoryModel
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean() // Use lean() for better performance - returns plain objects
        .exec(),
      this.pdfChatHistoryModel.countDocuments(query).exec(),
    ]);

    return {
      chats: chats as any[], // lean() returns plain objects, not Mongoose documents
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByUserId(userId: string): Promise<PdfChatHistoryDocument[]> {
    return this.pdfChatHistoryModel
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .exec();
  }

  /**
   * Finds a recent chat entry with the same session_id, question, and answer (within last 2 minutes).
   * Used to skip duplicate inserts from transport retries.
   */
  async findRecentDuplicate(
    sessionId: string,
    question: string,
    answer: string,
  ): Promise<PdfChatHistoryDocument | null> {
    const since = new Date(Date.now() - 2 * 60 * 1000);
    return this.pdfChatHistoryModel
      .findOne({
        session_id: sessionId,
        question,
        answer,
        created_at: { $gte: since },
      })
      .exec();
  }

  async updateRating(
    chatId: string,
    rating: number,
  ): Promise<PdfChatHistoryDocument | null> {
    return this.pdfChatHistoryModel
      .findOneAndUpdate(
        { chatId },
        { rating, updated_at: new Date() },
        { new: true },
      )
      .exec();
  }

  async countBySessionId(sessionId: string): Promise<number> {
    return this.pdfChatHistoryModel
      .countDocuments({ session_id: sessionId })
      .exec();
  }

  async countByUserId(userId: string): Promise<number> {
    return this.pdfChatHistoryModel.countDocuments({ user_id: userId }).exec();
  }

  async deleteBySessionId(sessionId: string): Promise<boolean> {
    const result = await this.pdfChatHistoryModel
      .deleteMany({ session_id: sessionId })
      .exec();
    return result.deletedCount > 0;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.pdfChatHistoryModel
      .deleteMany({ user_id: userId })
      .exec();
    return result.deletedCount;
  }

  async getTotalCount(filters?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    const query: any = {};
    if (filters?.userId) {
      query.user_id = filters.userId;
    }
    if (filters?.startDate || filters?.endDate) {
      query.created_at = {};
      if (filters.startDate) {
        query.created_at.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.created_at.$lte = filters.endDate;
      }
    }
    return this.pdfChatHistoryModel.countDocuments(query).exec();
  }

  async getAverageResponseTime(filters?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    const match: any = {};
    if (filters?.userId) {
      match.user_id = filters.userId;
    }
    if (filters?.startDate || filters?.endDate) {
      match.created_at = {};
      if (filters.startDate) {
        match.created_at.$gte = filters.startDate;
      }
      if (filters.endDate) {
        match.created_at.$lte = filters.endDate;
      }
    }

    const result = await this.pdfChatHistoryModel
      .aggregate([
        { $match: match },
        { $group: { _id: null, avg: { $avg: '$response_time_ms' } } },
      ])
      .exec();
    return result.length > 0 ? result[0].avg || 0 : 0;
  }

  async getMostCommonQueries(
    limit: number = 10,
    filters?: { userId?: string; startDate?: Date; endDate?: Date },
  ): Promise<Array<{ query: string; count: number }>> {
    const match: any = {};
    if (filters?.userId) {
      match.user_id = filters.userId;
    }
    if (filters?.startDate || filters?.endDate) {
      match.created_at = {};
      if (filters.startDate) {
        match.created_at.$gte = filters.startDate;
      }
      if (filters.endDate) {
        match.created_at.$lte = filters.endDate;
      }
    }

    const result = await this.pdfChatHistoryModel
      .aggregate([
        { $match: match },
        { $group: { _id: '$question', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
        { $project: { query: '$_id', count: 1, _id: 0 } },
      ])
      .exec();
    return result;
  }

  async getQueriesByHour(filters?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Array<{ hour: string; count: number }>> {
    const match: any = {};
    if (filters?.userId) {
      match.user_id = filters.userId;
    }
    if (filters?.startDate || filters?.endDate) {
      match.created_at = {};
      if (filters.startDate) {
        match.created_at.$gte = filters.startDate;
      }
      if (filters.endDate) {
        match.created_at.$lte = filters.endDate;
      }
    }

    const result = await this.pdfChatHistoryModel
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d %H:00', date: '$created_at' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { hour: '$_id', count: 1, _id: 0 } },
      ])
      .exec();
    return result;
  }

  async getAverageRating(filters?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    const match: any = { rating: { $exists: true, $ne: null } };
    if (filters?.userId) {
      match.user_id = filters.userId;
    }
    if (filters?.startDate || filters?.endDate) {
      match.created_at = {};
      if (filters.startDate) {
        match.created_at.$gte = filters.startDate;
      }
      if (filters.endDate) {
        match.created_at.$lte = filters.endDate;
      }
    }

    const result = await this.pdfChatHistoryModel
      .aggregate([
        { $match: match },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ])
      .exec();
    return result.length > 0 ? result[0].avg || 0 : 0;
  }
}
