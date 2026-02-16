import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateFeedbackDto } from './dto/feedback.dto';
import { UpdateFeedbackDto } from './dto/feedback.dto';
import { UserFeedbackDocument } from '../../schemas/feedback.schemas';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel('UserFeedback') private model: Model<UserFeedbackDocument>,
  ) {}

  async add(userId: string, dto: CreateFeedbackDto) {
    return this.model.create({ userId, ...dto });
  }

  async getAll(userId: string) {
    return this.model.find({ userId });
  }

  async getOne(userId: string, id: string) {
    const f = await this.model.findOne({ _id: id, userId });
    if (!f) throw new NotFoundException('Feedback not found');
    return f;
  }

  async update(userId: string, id: string, dto: UpdateFeedbackDto) {
    const f = await this.model.findOneAndUpdate({ _id: id, userId }, dto, {
      new: true,
    });
    if (!f) throw new NotFoundException('Feedback not found');
    return f;
  }

  async delete(userId: string, id: string) {
    const f = await this.model.findOneAndDelete({ _id: id, userId });
    if (!f) throw new NotFoundException('Feedback not found');
    return 'Feedback deleted';
  }

  async addMessage(userId: string, id: string, message: string) {
    const f = await this.model.findOneAndUpdate(
      { _id: id, userId },
      {
        $push: { messages: { sender: 'user', message, createdAt: new Date() } },
      },
      { new: true },
    );
    if (!f) throw new NotFoundException('Feedback not found');
    return f.messages;
  }

  async getMessages(userId: string, id: string) {
    const f = await this.model.findOne({ _id: id, userId }, { messages: 1 });
    if (!f) throw new NotFoundException('Feedback not found');
    return f.messages;
  }

  async updateStatus(userId: string, id: string, status: string) {
    const f = await this.model.findOneAndUpdate(
      { _id: id, userId },
      { status },
      { new: true },
    );
    if (!f) throw new NotFoundException('Feedback not found');
    return f;
  }
}
