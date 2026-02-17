import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  FeedbackDto,
  AddMessageDto,
  UpdateStatusDto,
} from './dto/feedback.dto';

@Injectable()
export class FeedbackGatewayService {
  constructor(@Inject('NATS_SERVICE') private readonly client: ClientProxy) {}

  create(createFeedbackDto: FeedbackDto, userId: string) {
    return this.client.send(
      { cmd: 'createFeedback' },
      { createFeedbackDto, userId },
    );
  }

  findAll(userId: string) {
    return this.client.send({ cmd: 'findAllFeedback' }, { userId });
  }

  findOne(userId: string, id: string) {
    return this.client.send({ cmd: 'findOneFeedback' }, { userId, id });
  }

  update(userId: string, id: string, updateFeedbackDto: FeedbackDto) {
    return this.client.send(
      { cmd: 'updateFeedback' },
      {
        userId,
        updateFeedbackDto: { ...updateFeedbackDto, id },
      },
    );
  }

  remove(userId: string, id: string) {
    return this.client.send({ cmd: 'removeFeedback' }, { userId, id });
  }

  createMessage(userId: string, id: string, message: AddMessageDto) {
    return this.client.send({ cmd: 'createMessage' }, { userId, id, message });
  }

  findOneMessages(userId: string, id: string) {
    return this.client.send({ cmd: 'findOneMessages' }, { userId, id });
  }

  updateStatus(userId: string, id: string, status: UpdateStatusDto) {
    return this.client.send({ cmd: 'updateStatus' }, { userId, id, status });
  }
}
