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
    const baseFilter = {
      userId: userObjectId,
      feature: params.feature,
      date: params.date,
    };

    if (params.usageUnit === 'minutes') {
      const limitMinutes = params.limitDurationMinutes;
      if (limitMinutes === null) {
        await this.model
          .updateOne(
            baseFilter,
            {
              $inc: { usedDurationMinutes: params.incrementBy },
              $setOnInsert: {
                ...baseFilter,
                usageUnit: 'minutes',
                usedCount: 0,
                limitCount: params.limitCount,
                limitDurationMinutes: null,
                createdAt: new Date(),
              },
              $set: { updatedAt: new Date() },
            },
            { upsert: true },
          )
          .exec();

        return { allowed: true };
      }

      const updateResult = await this.model
        .updateOne(
          {
            ...baseFilter,
            $or: [
              { usedDurationMinutes: { $lt: limitMinutes } },
              { usedDurationMinutes: { $exists: false } },
            ],
          },
          {
            $inc: { usedDurationMinutes: params.incrementBy },
            $set: { updatedAt: new Date() },
          },
          { upsert: false },
        )
        .exec();

      if (updateResult.modifiedCount > 0) {
        return { allowed: true };
      }

      try {
        await this.model.create({
          ...baseFilter,
          usageUnit: 'minutes',
          usedCount: 0,
          usedDurationMinutes: params.incrementBy,
          limitCount: params.limitCount,
          limitDurationMinutes: limitMinutes,
        });
        return { allowed: true };
      } catch (error: unknown) {
        if (this.isDuplicateKeyError(error)) {
          return { allowed: false };
        }
        throw error;
      }
    }

    const limitCount = params.limitCount;
    if (limitCount === null) {
      await this.model
        .updateOne(
          baseFilter,
          {
            $inc: { usedCount: params.incrementBy },
            $setOnInsert: {
              ...baseFilter,
              usageUnit: 'count',
              usedDurationMinutes: 0,
              limitCount: null,
              limitDurationMinutes: params.limitDurationMinutes,
              createdAt: new Date(),
            },
            $set: { updatedAt: new Date() },
          },
          { upsert: true },
        )
        .exec();

      return { allowed: true };
    }

    const updateResult = await this.model
      .updateOne(
        {
          ...baseFilter,
          $or: [
            { usedCount: { $lt: limitCount } },
            { usedCount: { $exists: false } },
          ],
        },
        {
          $inc: { usedCount: params.incrementBy },
          $set: { updatedAt: new Date() },
        },
        { upsert: false },
      )
      .exec();

    if (updateResult.modifiedCount > 0) {
      return { allowed: true };
    }

    try {
      await this.model.create({
        ...baseFilter,
        usageUnit: 'count',
        usedCount: params.incrementBy,
        usedDurationMinutes: 0,
        limitCount,
        limitDurationMinutes: params.limitDurationMinutes,
      });
      return { allowed: true };
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        return { allowed: false };
      }
      throw error;
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const maybeCode = (error as { code?: unknown }).code;
    return maybeCode === 11000;
  }
}
