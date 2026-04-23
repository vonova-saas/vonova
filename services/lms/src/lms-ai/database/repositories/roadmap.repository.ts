import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Roadmap, RoadmapDocument } from '../schemas/roadmap.schema';
import { LMS_AI_CONNECTION_NAME } from '../constants';

@Injectable()
export class RoadmapRepository {
  constructor(
    @InjectModel(Roadmap.name, LMS_AI_CONNECTION_NAME)
    private roadmapModel: Model<RoadmapDocument>,
  ) {}

  /**
   * Build query to match userId as string or ObjectId (24-char hex),
   * to support legacy docs where userId may have been stored as ObjectId.
   */
  private userMatch(userId: string): {
    userId?: string;
    $or?: Array<{ userId: string | Types.ObjectId }>;
  } {
    const strId = String(userId).trim();
    try {
      if (/^[a-fA-F0-9]{24}$/.test(strId)) {
        const oid = new Types.ObjectId(strId);
        return { $or: [{ userId: strId }, { userId: oid }] };
      }
    } catch {
      // fall through
    }
    return { userId: strId };
  }

  async create(roadmapData: Partial<Roadmap>): Promise<RoadmapDocument> {
    const roadmap = new this.roadmapModel(roadmapData);
    return roadmap.save();
  }

  async findById(roadmapId: string): Promise<RoadmapDocument | null> {
    return this.roadmapModel.findOne({ roadmapId }).exec();
  }

  async findByUserId(userId: string): Promise<RoadmapDocument[]> {
    return this.roadmapModel
      .find(this.userMatch(userId))
      .sort({ created_at: -1 })
      .exec();
  }

  async findByTopic(topic: string): Promise<RoadmapDocument[]> {
    return this.roadmapModel
      .find({ topic: new RegExp(topic, 'i') })
      .sort({ created_at: -1 })
      .exec();
  }

  /**
   * Returns both casings for skill_level so 'beginner' and 'Beginner' match the same docs.
   */
  private static skillLevelQueryVariants(skillLevel: string): string[] {
    const lower = skillLevel.toLowerCase();
    const title =
      skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1).toLowerCase();
    return [...new Set([skillLevel, lower, title])];
  }

  async findSimilar(
    topic: string,
    skillLevel: string,
    durationWeeks: number,
    userId?: string,
  ): Promise<RoadmapDocument[]> {
    const skillLevelVariants =
      RoadmapRepository.skillLevelQueryVariants(skillLevel);
    const query: Record<string, unknown> = {
      topic: new RegExp(topic, 'i'),
      skill_level: { $in: skillLevelVariants },
      duration_weeks: { $gte: durationWeeks - 2, $lte: durationWeeks + 2 },
    };
    if (userId?.trim()) {
      Object.assign(query, this.userMatch(userId));
    }
    return this.roadmapModel
      .find(query)
      .sort({ created_at: -1 })
      .limit(5)
      .exec();
  }

  async updateStatus(
    roadmapId: string,
    status: string,
  ): Promise<RoadmapDocument | null> {
    return this.roadmapModel
      .findOneAndUpdate(
        { roadmapId },
        { status, updated_at: new Date() },
        { new: true },
      )
      .exec();
  }

  async countByUserId(userId: string): Promise<number> {
    return this.roadmapModel.countDocuments(this.userMatch(userId)).exec();
  }

  async deleteById(roadmapId: string): Promise<boolean> {
    const result = await this.roadmapModel.deleteOne({ roadmapId }).exec();
    return result.deletedCount > 0;
  }

  async getTotalCount(filters?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    const query: any = {};
    if (filters?.userId) {
      Object.assign(query, this.userMatch(filters.userId));
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
    return this.roadmapModel.countDocuments(query).exec();
  }

  async getActiveRoadmapsCount(userId?: string): Promise<number> {
    const query: Record<string, unknown> = {
      status: { $in: ['generated', 'in_progress'] },
    };
    if (userId?.trim()) Object.assign(query, this.userMatch(userId));
    return this.roadmapModel.countDocuments(query).exec();
  }

  async getAverageGenerationTime(userId?: string): Promise<number> {
    const match: Record<string, unknown> = {
      generation_time_ms: { $exists: true, $ne: null },
    };
    if (userId?.trim()) Object.assign(match, this.userMatch(userId));
    const result = await this.roadmapModel
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            avgTime: { $avg: '$generation_time_ms' },
          },
        },
      ])
      .exec();
    return result.length > 0 ? result[0].avgTime : 0;
  }

  async getRoadmapsByStatus(userId?: string): Promise<Record<string, number>> {
    const pipeline: any[] = [];
    if (userId?.trim()) {
      pipeline.push({ $match: this.userMatch(userId) });
    }
    pipeline.push({ $group: { _id: '$status', count: { $sum: 1 } } });
    const result = await this.roadmapModel.aggregate(pipeline).exec();
    const statusMap: Record<string, number> = {};
    result.forEach((item) => {
      statusMap[item._id] = item.count;
    });
    return statusMap;
  }

  async getPopularTopics(
    limit: number = 10,
  ): Promise<Array<{ topic: string; count: number }>> {
    const result = await this.roadmapModel
      .aggregate([
        {
          $group: {
            _id: '$topic',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            topic: '$_id',
            count: 1,
            _id: 0,
          },
        },
      ])
      .exec();
    return result;
  }

  async getSkillLevelDistribution(): Promise<Record<string, number>> {
    const result = await this.roadmapModel
      .aggregate([
        {
          $group: {
            _id: '$skill_level',
            count: { $sum: 1 },
          },
        },
      ])
      .exec();
    const distribution: Record<string, number> = {};
    result.forEach((item) => {
      distribution[item._id] = item.count;
    });
    return distribution;
  }

  async getAverageDuration(): Promise<number> {
    const result = await this.roadmapModel
      .aggregate([
        {
          $group: {
            _id: null,
            avgDuration: { $avg: '$duration_weeks' },
          },
        },
      ])
      .exec();
    return result.length > 0 ? result[0].avgDuration : 0;
  }

  async getCompletionRate(): Promise<number> {
    const [completed, total] = await Promise.all([
      this.roadmapModel.countDocuments({ status: 'completed' }).exec(),
      this.roadmapModel.countDocuments().exec(),
    ]);
    return total > 0 ? completed / total : 0;
  }
}
