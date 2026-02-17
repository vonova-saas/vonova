import { Injectable } from '@nestjs/common';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Feedback } from './schema/feedback.schema';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<Feedback>,
  ) {}

  async create(createFeedbackDto: CreateFeedbackDto, userId: string) {
    const feedback = await this.feedbackModel.create({
      ...createFeedbackDto,
      userId,
    });
    return {
      message: 'Feedback created successfully',
      data: feedback,
    };
  }

  async findAll(userId: string) {
    const feedback = await this.feedbackModel.find({ userId });
    if (!feedback) {
      throw new RpcException({
        statusCode: 404,
        message: `Feedback for user ${userId} not found`,
      });
    }
    return {
      message: 'Feedback found successfully',
      data: feedback,
    };
  }

  async findOne(userId: string, id: string) {
    const feedback = await this.feedbackModel
      .findOne({ _id: id, userId })
      .exec();
    if (!feedback) {
      throw new RpcException({
        statusCode: 404,
        message: `Feedback for user ${userId} not found`,
      });
    }
    return {
      message: 'Feedback found successfully',
      data: feedback,
    };
  }

  async update(
    userId: string,
    id: string,
    updateFeedbackDto: UpdateFeedbackDto,
  ) {
    const feedback = await this.feedbackModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateFeedbackDto },
      { new: true },
    );
    if (!feedback) {
      throw new RpcException({
        statusCode: 404,
        message: `Feedback for user ${userId} not found`,
      });
    }
    return {
      message: 'Feedback updated successfully',
      data: feedback,
    };
  }

  async remove(userId: string, id: string) {
    const deleted = await this.feedbackModel.findOneAndDelete({
      _id: id,
      userId,
    });
    if (!deleted) {
      throw new RpcException({
        statusCode: 404,
        message: `Feedback for user ${userId} not found`,
      });
    }
    return {
      message: 'Feedback deleted successfully',
    };
  }

  async createMessage(userId: string, id: string, message: string) {
    const feedback = await this.feedbackModel.findOneAndUpdate(
      { _id: id, userId },
      {
        $push: { messages: { sender: 'user', message, createdAt: new Date() } },
        $set: { updatedAt: new Date() },
      },
      { new: true },
    );
    if (!feedback) {
      throw new RpcException({
        statusCode: 404,
        message: `Feedback for user ${userId} not found`,
      });
    }
    return {
      message: 'Message added successfully',
      data: feedback.messages,
    };
  }

  async findOneMessages(userId: string, id: string) {
    const feedback = await this.feedbackModel.findOne(
      { _id: id, userId },
      { messages: 1 },
    );
    if (!feedback) {
      throw new RpcException({
        statusCode: 404,
        message: `Feedback for user ${userId} not found`,
      });
    }
    return {
      message: 'Messages found successfully',
      data: feedback.messages,
    };
  }

  async updateStatus(userId: string, id: string, status: string) {
    const feedback = await this.feedbackModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { status } },
      { new: true },
    );
    if (!feedback) {
      throw new RpcException({
        statusCode: 404,
        message: `Feedback for user ${userId} not found`,
      });
    }
    return {
      message: 'Status updated successfully',
      data: feedback,
    };
  }
}
