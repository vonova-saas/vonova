/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FeedbackGatewayService } from './feedback.service';
import {
  FeedbackDto,
  AddMessageDto,
  UpdateStatusDto,
} from './dto/feedback.dto';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('api/v1/app/feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackGatewayController {
  constructor(private readonly feedbackService: FeedbackGatewayService) {}

  @Post()
  async create(@Body() createFeedbackDto: FeedbackDto, @Request() req: any) {
    return firstValueFrom(
      this.feedbackService.create(createFeedbackDto, req.user._id),
    );
  }

  @Get()
  async findAll(@Request() req: any) {
    return firstValueFrom(this.feedbackService.findAll(req.user._id));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return firstValueFrom(this.feedbackService.findOne(req.user._id, id));
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateFeedbackDto: FeedbackDto,
    @Request() req: any,
  ) {
    return firstValueFrom(
      this.feedbackService.update(req.user._id, id, updateFeedbackDto),
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return firstValueFrom(this.feedbackService.remove(req.user._id, id));
  }

  @Post(':id/messages')
  async createMessage(
    @Param('id') id: string,
    @Body('message') message: AddMessageDto,
    @Request() req: any,
  ) {
    return firstValueFrom(
      this.feedbackService.createMessage(req.user._id, id, message),
    );
  }

  @Get(':id/messages')
  async findOneMessages(@Param('id') id: string, @Request() req: any) {
    return firstValueFrom(
      this.feedbackService.findOneMessages(req.user._id, id),
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: UpdateStatusDto,
    @Request() req: any,
  ) {
    return firstValueFrom(
      this.feedbackService.updateStatus(req.user._id, id, status),
    );
  }
}
