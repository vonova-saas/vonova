import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Roadmap, RoadmapDocument } from '../schemas/roadmap.schema';

@Injectable()
export class RoadmapRepository {
  constructor(
    @InjectModel(Roadmap.name) private roadmapModel: Model<RoadmapDocument>,
  ) { }

  async create(roadmapData: Partial<Roadmap>): Promise<RoadmapDocument> {
    const roadmap = new this.roadmapModel(roadmapData);
    return roadmap.save();
  }

  async findById(roadmapId: string): Promise<RoadmapDocument | null> {
    return this.roadmapModel.findOne({ roadmapId }).exec();
  }

  async findByUserId(userId: string): Promise<RoadmapDocument[]> {
    return this.roadmapModel.find({ userId }).sort({ created_at: -1 }).exec();
  }

  async findByTopic(topic: string): Promise<RoadmapDocument[]> {
    return this.roadmapModel.find({ topic: new RegExp(topic, 'i') }).sort({ created_at: -1 }).exec();
  }

  async findSimilar(topic: string, skillLevel: string, durationWeeks: number): Promise<RoadmapDocument[]> {
    return this.roadmapModel.find({
      topic: new RegExp(topic, 'i'),
      skill_level: skillLevel,
      duration_weeks: { $gte: durationWeeks - 2, $lte: durationWeeks + 2 }
    }).sort({ created_at: -1 }).limit(5).exec();
  }

  async updateStatus(roadmapId: string, status: string): Promise<RoadmapDocument | null> {
    return this.roadmapModel.findOneAndUpdate(
      { roadmapId },
      { status, updated_at: new Date() },
      { new: true }
    ).exec();
  }

  async countByUserId(userId: string): Promise<number> {
    return this.roadmapModel.countDocuments({ userId }).exec();
  }

  async deleteById(roadmapId: string): Promise<boolean> {
    const result = await this.roadmapModel.deleteOne({ roadmapId }).exec();
    return result.deletedCount > 0;
  }
}
