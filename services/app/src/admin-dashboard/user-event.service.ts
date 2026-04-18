import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserEvent, UserEventDocument } from './schemas/user-event.schema';

@Injectable()
export class UserEventService {
  constructor(
    @InjectModel(UserEvent.name)
    private readonly eventModel: Model<UserEventDocument>,
  ) {}

  async log(
    userId: string,
    action: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.eventModel.create({
      userId: new Types.ObjectId(userId),
      action,
      metadata,
    });
  }
}
