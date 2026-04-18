import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserActivity, UserActivityDocument } from './schemas/user-activity.schema';

@Injectable()
export class AdminActivityService {
  constructor(
    @InjectModel(UserActivity.name)
    private readonly activityModel: Model<UserActivityDocument>,
  ) {}

  async touch(userId: string, lastAction: string): Promise<void> {
    const now = new Date();
    await this.activityModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        $set: {
          lastSeenAt: now,
          lastAction: lastAction.slice(0, 500),
        },
      },
      { upsert: true, new: true },
    );
  }

  async findByUserIds(
    userIds: Types.ObjectId[],
  ): Promise<Map<string, UserActivityDocument>> {
    if (!userIds.length) return new Map();
    const rows = await this.activityModel.find({
      userId: { $in: userIds },
    });
    const map = new Map<string, UserActivityDocument>();
    for (const row of rows) {
      map.set(String(row.userId), row);
    }
    return map;
  }
}
