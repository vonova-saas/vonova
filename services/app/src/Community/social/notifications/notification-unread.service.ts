import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class NotificationUnreadService {
  constructor(
    @InjectModel('NotificationUnreadCounter')
    private readonly counterModel: Model<{ userId: Types.ObjectId; unread: number }>,
    @InjectModel('CommunityNotification')
    private readonly notificationModel: Model<unknown>,
  ) {}

  private oid(id: string) {
    return new Types.ObjectId(id);
  }

  async getUnread(userId: string): Promise<number> {
    const row = await this.counterModel
      .findOne({ userId: this.oid(userId) })
      .lean();
    if (row) return Math.max(0, row.unread ?? 0);
    return this.notificationModel.countDocuments({
      userId: this.oid(userId),
      read: false,
    });
  }

  async increment(userId: string, delta = 1): Promise<number> {
    const uid = this.oid(userId);
    const row = await this.counterModel.findOneAndUpdate(
      { userId: uid },
      { $inc: { unread: delta }, $setOnInsert: { userId: uid } },
      { upsert: true, new: true },
    );
    return Math.max(0, row?.unread ?? delta);
  }

  async decrement(userId: string, delta = 1): Promise<number> {
    const current = await this.getUnread(userId);
    const next = Math.max(0, current - delta);
    await this.counterModel.updateOne(
      { userId: this.oid(userId) },
      { $set: { unread: next } },
      { upsert: true },
    );
    return next;
  }

  async setCount(userId: string, unread: number): Promise<number> {
    const n = Math.max(0, unread);
    await this.counterModel.updateOne(
      { userId: this.oid(userId) },
      { $set: { unread: n }, $setOnInsert: { userId: this.oid(userId) } },
      { upsert: true },
    );
    return n;
  }

  async syncFromDb(userId: string): Promise<number> {
    const count = await this.notificationModel.countDocuments({
      userId: this.oid(userId),
      read: false,
    });
    return this.setCount(userId, count);
  }
}
