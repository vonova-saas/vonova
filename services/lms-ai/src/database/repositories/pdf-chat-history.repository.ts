import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PdfChatHistory, PdfChatHistoryDocument } from '../schemas/pdf-chat-history.schema';

@Injectable()
export class PdfChatHistoryRepository {
  constructor(
    @InjectModel(PdfChatHistory.name) private pdfChatHistoryModel: Model<PdfChatHistoryDocument>,
  ) { }

  async create(chatData: Partial<PdfChatHistory>): Promise<PdfChatHistoryDocument> {
    const chat = new this.pdfChatHistoryModel(chatData);
    return chat.save();
  }

  async findBySessionId(sessionId: string, page: number = 1, limit: number = 20): Promise<{
    chats: PdfChatHistoryDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const [chats, total] = await Promise.all([
      this.pdfChatHistoryModel.find({ session_id: sessionId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.pdfChatHistoryModel.countDocuments({ session_id: sessionId }).exec()
    ]);

    return {
      chats,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findByUserId(userId: string): Promise<PdfChatHistoryDocument[]> {
    return this.pdfChatHistoryModel.find({ user_id: userId }).sort({ created_at: -1 }).exec();
  }

  async updateRating(chatId: string, rating: number): Promise<PdfChatHistoryDocument | null> {
    return this.pdfChatHistoryModel.findOneAndUpdate(
      { chatId },
      { rating, updated_at: new Date() },
      { new: true }
    ).exec();
  }

  async countBySessionId(sessionId: string): Promise<number> {
    return this.pdfChatHistoryModel.countDocuments({ session_id: sessionId }).exec();
  }

  async countByUserId(userId: string): Promise<number> {
    return this.pdfChatHistoryModel.countDocuments({ user_id: userId }).exec();
  }
}
