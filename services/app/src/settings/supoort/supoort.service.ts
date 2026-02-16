import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserSupportDocument } from '../../schemas/support.schema';
import { CreateSupportDto } from './dto/support.dto';
import { UpdateSupportDto } from './dto/support.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel('UserSupport')
    private readonly supportModel: Model<UserSupportDocument>,
  ) {}

  async addUserSupport(userId: string, dto: CreateSupportDto) {
    const support = await this.supportModel.create({ userId, ...dto });
    return support;
  }

  async getUserSupports(userId: string) {
    return this.supportModel.find({ userId });
  }

  async getUserSupportById(userId: string, id: string) {
    const support = await this.supportModel.findOne({ _id: id, userId });
    if (!support) throw new NotFoundException('Support Not Found');
    return support;
  }

  async updateUserSupport(userId: string, id: string, dto: UpdateSupportDto) {
    const support = await this.supportModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: dto },
      { new: true },
    );
    if (!support) throw new NotFoundException('Support Not Found');
    return support;
  }

  async deleteUserSupport(userId: string, id: string) {
    const deleted = await this.supportModel.findOneAndDelete({
      _id: id,
      userId,
    });
    if (!deleted) throw new NotFoundException('Support Not Found');
    return { message: 'Support deleted successfully' };
  }

  async addMessage(userId: string, id: string, message: string) {
    const support = await this.supportModel.findOneAndUpdate(
      { _id: id, userId },
      {
        $push: { messages: { sender: 'user', message, createdAt: new Date() } },
        $set: { updatedAt: new Date() },
      },
      { new: true },
    );
    if (!support) throw new NotFoundException('Support Not Found');
    return support.messages;
  }

  async getMessages(userId: string, id: string) {
    const support = await this.supportModel.findOne(
      { _id: id, userId },
      { messages: 1 },
    );
    if (!support) throw new NotFoundException('Support Not Found');
    return support.messages;
  }

  async updateStatus(userId: string, id: string, status: string) {
    const support = await this.supportModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { status } },
      { new: true },
    );
    if (!support) throw new NotFoundException('Support Not Found');
    return support;
  }
}
