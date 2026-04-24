import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  FeatureUsage,
  FeatureUsageDocument,
} from '../schemas/feature-usage.schema';
import { LMS_AI_CONNECTION_NAME } from '../constants';

@Injectable()
export class FeatureUsageRepository {
  constructor(
    @InjectModel(FeatureUsage.name, LMS_AI_CONNECTION_NAME)
    private readonly model: Model<FeatureUsageDocument>,
  ) {}

  async findOne(userId: string, feature: string, date: string) {
    return this.model
      .findOne({
        userId: new Types.ObjectId(userId),
        feature,
        date,
      })
      .lean()
      .exec();
  }

  async consumeUsageAtomically(params: {
    userId: string;
    feature: 'ai_roadmap' | 'pdf_summary' | 'pdf_voice';
    date: string;
    usageUnit: 'count' | 'minutes';
    incrementBy: number;
    limitCount: number | null;
    limitDurationMinutes: number | null;
  }) {
    const userObjectId = new Types.ObjectId(params.userId);

    if (params.usageUnit === 'minutes') {
      const limitMinutes = params.limitDurationMinutes;
      const filter =
        limitMinutes === null
          ? { userId: userObjectId, feature: params.feature, date: params.date }
          : {
              userId: userObjectId,
              feature: params.feature,
              date: params.date,
              $expr: {
                $lt: [{ $ifNull: ['$usedDurationMinutes', 0] }, limitMinutes],
              },
            };
      const updateResult = await this.model
        .updateOne(
          filter,
          {
            $inc: { usedDurationMinutes: params.incrementBy },
            $setOnInsert: {
              userId: userObjectId,
              feature: params.feature,
              date: params.date,
              usageUnit: 'minutes',
              usedCount: 0,
              limitCount: params.limitCount,
              limitDurationMinutes: limitMinutes,
              createdAt: new Date(),
            },
            $set: {
              updatedAt: new Date(),
              limitCount: params.limitCount,
              limitDurationMinutes: limitMinutes,
            },
          },
          { upsert: true },
        )
        .exec();

      const exceeded =
        limitMinutes !== null &&
        updateResult.matchedCount === 0 &&
        updateResult.upsertedCount === 0 &&
        updateResult.modifiedCount === 0;

      return { allowed: !exceeded };
    }

    const limitCount = params.limitCount;
    const filter =
      limitCount === null
        ? { userId: userObjectId, feature: params.feature, date: params.date }
        : {
            userId: userObjectId,
            feature: params.feature,
            date: params.date,
            $expr: {
              $lt: [{ $ifNull: ['$usedCount', 0] }, limitCount],
            },
          };

    const updateResult = await this.model
      .updateOne(
        filter,
        {
          $inc: { usedCount: params.incrementBy },
          $setOnInsert: {
            userId: userObjectId,
            feature: params.feature,
            date: params.date,
            usageUnit: 'count',
            usedDurationMinutes: 0,
            limitCount,
            limitDurationMinutes: params.limitDurationMinutes,
            createdAt: new Date(),
          },
          $set: {
            updatedAt: new Date(),
            limitCount,
            limitDurationMinutes: params.limitDurationMinutes,
          },
        },
        { upsert: true },
      )
      .exec();

    const exceeded =
      limitCount !== null &&
      updateResult.matchedCount === 0 &&
      updateResult.upsertedCount === 0 &&
      updateResult.modifiedCount === 0;

    return { allowed: !exceeded };
  }
}
