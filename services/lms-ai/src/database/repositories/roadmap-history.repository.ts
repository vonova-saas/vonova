import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoadmapHistory, RoadmapHistoryDocument } from '../schemas/roadmap-history.schema';

@Injectable()
export class RoadmapHistoryRepository {
  constructor(
    @InjectModel(RoadmapHistory.name) private roadmapHistoryModel: Model<RoadmapHistoryDocument>,
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
}
