import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoadmapHistory, RoadmapHistoryDocument } from '../schemas/roadmap-history.schema';
import { LMS_AI_CONNECTION_NAME } from '../constants';

@Injectable()
export class RoadmapHistoryRepository {
  constructor(
    @InjectModel(RoadmapHistory.name, LMS_AI_CONNECTION_NAME) private roadmapHistoryModel: Model<RoadmapHistoryDocument>,
  ) { }

  async create(historyData: Partial<RoadmapHistory>): Promise<RoadmapHistoryDocument> {
    const history = new this.roadmapHistoryModel(historyData);
    return history.save();
  }

  async findByRoadmapId(roadmapId: string): Promise<RoadmapHistoryDocument[]> {
    return this.roadmapHistoryModel.find({ roadmapId }).sort({ timestamp: -1 }).exec();
  }

  async findByUserId(userId: string): Promise<RoadmapHistoryDocument[]> {
    return this.roadmapHistoryModel.find({ userId }).sort({ timestamp: -1 }).exec();
  }

  async findByAction(action: string): Promise<RoadmapHistoryDocument[]> {
    return this.roadmapHistoryModel.find({ action }).sort({ timestamp: -1 }).exec();
  }

  async countByRoadmapId(roadmapId: string): Promise<number> {
    return this.roadmapHistoryModel.countDocuments({ roadmapId }).exec();
  }

  async countByUserId(userId: string): Promise<number> {
    return this.roadmapHistoryModel.countDocuments({ userId }).exec();
  }

  async findByRoadmapIdPaginated(roadmapId: string, page: number, limit: number): Promise<{
    history: RoadmapHistoryDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const [history, total] = await Promise.all([
      this.roadmapHistoryModel
        .find({ roadmapId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.roadmapHistoryModel.countDocuments({ roadmapId }).exec()
    ]);

    return {
      history,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async deleteByRoadmapId(roadmapId: string): Promise<number> {
    const result = await this.roadmapHistoryModel.deleteMany({ roadmapId }).exec();
    return result.deletedCount;
  }

  async getTotalCount(filters?: { userId?: string; startDate?: Date; endDate?: Date }): Promise<number> {
    const query: any = {};
    if (filters?.userId) {
      query.userId = filters.userId;
    }
    if (filters?.startDate || filters?.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.timestamp.$lte = filters.endDate;
      }
    }
    return this.roadmapHistoryModel.countDocuments(query).exec();
  }
}
