import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/feedback.dto';
import { UpdateFeedbackDto } from './dto/feedback.dto';
import { CreateMessageDto } from './dto/feedback.dto';
import { UpdateStatusDto } from './dto/feedback.dto';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post(':userId/add')
  add(@Param('userId') userId: string, @Body() body: CreateFeedbackDto) {
    return this.feedbackService.add(userId, body);
  }

  @Get(':userId')
  getAll(@Param('userId') userId: string) {
    return this.feedbackService.getAll(userId);
  }

  @Get(':userId/:id')
  getOne(@Param('userId') userId: string, @Param('id') id: string) {
    return this.feedbackService.getOne(userId, id);
  }

  @Put(':userId/:id')
  update(
    @Param('userId') userId: string,
    @Param('id') id: string,
    @Body() body: UpdateFeedbackDto,
  ) {
    return this.feedbackService.update(userId, id, body);
  }

  @Delete(':userId/:id')
  delete(@Param('userId') userId: string, @Param('id') id: string) {
    return this.feedbackService.delete(userId, id);
  }

  @Post(':userId/:id/messages')
  addMessage(
    @Param('userId') userId: string,
    @Param('id') id: string,
    @Body() body: CreateMessageDto,
  ) {
    return this.feedbackService.addMessage(userId, id, body.message);
  }

  @Get(':userId/:id/messages')
  getMessages(@Param('userId') userId: string, @Param('id') id: string) {
    return this.feedbackService.getMessages(userId, id);
  }

  @Put(':userId/:id/status')
  updateStatus(
    @Param('userId') userId: string,
    @Param('id') id: string,
    @Body() body: UpdateStatusDto,
  ) {
    return this.feedbackService.updateStatus(userId, id, body.status);
  }
}
