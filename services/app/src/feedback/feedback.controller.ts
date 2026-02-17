import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Controller()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @MessagePattern({ cmd: 'createFeedback' })
  create(
    @Payload('userId') userId: string,
    @Payload('createFeedbackDto') createFeedbackDto: CreateFeedbackDto,
  ) {
    return this.feedbackService.create(createFeedbackDto, userId);
  }

  @MessagePattern({ cmd: 'findAllFeedback' })
  findAll(@Payload('userId') userId: string) {
    return this.feedbackService.findAll(userId);
  }

  @MessagePattern({ cmd: 'findOneFeedback' })
  findOne(@Payload('userId') userId: string, @Payload() id: string) {
    return this.feedbackService.findOne(userId, id);
  }

  @MessagePattern({ cmd: 'updateFeedback' })
  update(
    @Payload('userId') userId: string,
    @Payload('updateFeedbackDto') updateFeedbackDto: UpdateFeedbackDto,
  ) {
    return this.feedbackService.update(
      userId,
      updateFeedbackDto.id,
      updateFeedbackDto,
    );
  }

  @MessagePattern({ cmd: 'removeFeedback' })
  remove(@Payload('userId') userId: string, @Payload() id: string) {
    return this.feedbackService.remove(userId, id);
  }

  @MessagePattern({ cmd: 'createMessage' })
  createMessage(
    @Payload('userId') userId: string,
    @Payload() id: string,
    @Payload() message: string,
  ) {
    return this.feedbackService.createMessage(userId, id, message);
  }

  @MessagePattern({ cmd: 'findOneMessages' })
  findOneMessages(@Payload('userId') userId: string, @Payload() id: string) {
    return this.feedbackService.findOneMessages(userId, id);
  }

  @MessagePattern({ cmd: 'updateStatus' })
  updateStatus(
    @Payload('userId') userId: string,
    @Payload() id: string,
    @Payload() status: string,
  ) {
    return this.feedbackService.updateStatus(userId, id, status);
  }
}
